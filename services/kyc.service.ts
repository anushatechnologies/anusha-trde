import { Platform } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { apiClient } from '../api/client';
import type { KycStatusValue } from '../types';

export type KycDocumentStatus = 'NOT_UPLOADED' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'REUPLOAD_REQUIRED';

export type KycStatusResponse = {
  kycStatus: KycStatusValue;
  onboardingStatus?: string;
  accountStatus?: string;
  bankVerified?: boolean;
  mpinCreated?: boolean;
  canUpload: boolean;
  profile?: {
    panNumber?: string;
    aadhaarLast4?: string;
    dateOfBirth?: string;
    address?: string;
  };
  submission?: {
    id: string;
    userId: string;
    status: string;
    panCardPath?: string;
    panCardStatus?: KycDocumentStatus;
    panCardRejectionReason?: string;
    aadhaarFrontPath?: string;
    aadhaarFrontStatus?: KycDocumentStatus;
    aadhaarFrontRejectionReason?: string;
    aadhaarBackPath?: string;
    aadhaarBackStatus?: KycDocumentStatus;
    aadhaarBackRejectionReason?: string;
    selfiePath?: string;
    selfieStatus?: KycDocumentStatus;
    selfieRejectionReason?: string;
    bankProofPath?: string;
    bankProofStatus?: KycDocumentStatus;
    bankProofRejectionReason?: string;
    rejectionReason?: string | null;
    adminNotes?: string | null;
  };
};

export type KycSubmitPayload = {
  /** URI of PAN card image file — required on initial, optional on reupload */
  panCardImageUri?: string;
  /** URI of Aadhaar front image file — required on initial, optional on reupload */
  aadhaarFrontImageUri?: string;
  /** URI of Aadhaar back image file — required on initial, optional on reupload */
  aadhaarBackImageUri?: string;
  /** URI of selfie photo file — required on initial, optional on reupload */
  selfiePhotoUri?: string;
  /** URI of bank passbook or cancelled cheque image — required on initial, optional on reupload */
  bankPassbookUri?: string;
  /** PAN number text */
  panNumber: string;
  /** Last 4 digits of Aadhaar */
  aadhaarLast4: string;
  /** Date of birth in YYYY-MM-DD */
  dateOfBirth: string;
  /** Residential address */
  address: string;
};

/**
 * Compresses an image on both Native (Android/iOS) and Web using expo-image-manipulator.
 * Resizes the image to keep its maximum dimension under 1600px (preserving aspect ratio)
 * and compresses it with JPEG format at 70% quality.
 */
const compressImage = async (uri: string): Promise<string> => {
  try {
    // 1. Get original dimensions and apply compression
    const initial = await ImageManipulator.manipulateAsync(
      uri,
      [],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // 2. If larger than 1600px, resize to keep it compact and safe from limits
    const maxDimension = 1600;
    if (initial.width > maxDimension || initial.height > maxDimension) {
      const actions: ImageManipulator.Action[] = [];
      if (initial.width > initial.height) {
        actions.push({ resize: { width: maxDimension } });
      } else {
        actions.push({ resize: { height: maxDimension } });
      }

      const resized = await ImageManipulator.manipulateAsync(
        uri,
        actions,
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      return resized.uri;
    }

    return initial.uri;
  } catch (error) {
    console.error('Failed to compress image:', error);
    return uri; // fallback to original uri
  }
};

/**
 * Helper to dynamically append file/image fields to FormData based on platform.
 * On Web, it converts the local URI to a standard browser File/Blob.
 * On Native (Android/iOS), it uses the standard object structure.
 */
const appendFileToFormData = async (formData: FormData, fieldName: string, uri: string, filename: string) => {
  if (!uri) return;

  try {
    // Compress the image on all platforms (Web, Android, iOS) using expo-image-manipulator
    const compressedUri = await compressImage(uri);

    if (Platform.OS === 'web') {
      const response = await fetch(compressedUri);
      const blob = await response.blob();
      const file = new File([blob], filename, { type: 'image/jpeg' });
      formData.append(fieldName, file);
    } else {
      formData.append(fieldName, {
        uri: compressedUri,
        type: 'image/jpeg',
        name: filename,
      } as unknown as Blob);
    }
  } catch (error) {
    console.error(`Failed to compress or append file for ${fieldName}:`, error);
    // Fallback: append original URI directly
    if (Platform.OS === 'web') {
      try {
        const response = await fetch(uri);
        const blob = await response.blob();
        const file = new File([blob], filename, { type: blob.type || 'image/jpeg' });
        formData.append(fieldName, file);
      } catch (fallbackError) {
        console.error(`Fallback failed on web for ${fieldName}:`, fallbackError);
        formData.append(fieldName, {
          uri,
          type: 'image/jpeg',
          name: filename,
        } as unknown as Blob);
      }
    } else {
      formData.append(fieldName, {
        uri,
        type: 'image/jpeg',
        name: filename,
      } as unknown as Blob);
    }
  }
};

/**
 * Checks if a document needs to be (re)uploaded based on its status.
 * Used for reupload flow — only require files that are missing, REJECTED, or REUPLOAD_REQUIRED.
 */
const needsUpload = (status?: KycDocumentStatus): boolean => {
  if (!status) return true; // NOT_UPLOADED / missing
  return status === 'NOT_UPLOADED' || status === 'REJECTED' || status === 'REUPLOAD_REQUIRED';
};

/**
 * Submit ALL KYC documents in a single multipart call to POST /api/kyc/submit
 * Supports both initial upload (all 5 files) and reupload (only missing/rejected files).
 * On reupload, only include files that are provided (non-empty URIs).
 */
const sanitizeUri = (uri: string) => {
  if (Platform.OS === 'android' && !uri.startsWith('file://')) {
    return 'file://' + uri;
  }
  return uri;
};

const submitKyc = async (payload: KycSubmitPayload): Promise<KycStatusResponse> => {
  const formData = new FormData();

  // Only append files that are provided (supports partial reupload)
  if (payload.panCardImageUri) {
    await appendFileToFormData(formData, 'panCardImage', sanitizeUri(payload.panCardImageUri), 'pan-card.jpg');
  }
  if (payload.aadhaarFrontImageUri) {
    await appendFileToFormData(formData, 'aadhaarFrontImage', sanitizeUri(payload.aadhaarFrontImageUri), 'aadhaar-front.jpg');
  }
  if (payload.aadhaarBackImageUri) {
    await appendFileToFormData(formData, 'aadhaarBackImage', sanitizeUri(payload.aadhaarBackImageUri), 'aadhaar-back.jpg');
  }
  if (payload.selfiePhotoUri) {
    await appendFileToFormData(formData, 'selfiePhoto', sanitizeUri(payload.selfiePhotoUri), 'selfie.jpg');
  }
  if (payload.bankPassbookUri) {
    await appendFileToFormData(formData, 'bankPassbookOrStatement', sanitizeUri(payload.bankPassbookUri), 'bank-passbook.jpg');
  }

  formData.append('panNumber', payload.panNumber);
  formData.append('aadhaarLast4', payload.aadhaarLast4);
  formData.append('dateOfBirth', payload.dateOfBirth);
  formData.append('address', payload.address);

  // We use fetch instead of Axios for FormData because Axios has known bugs
  // on React Native Android when uploading multipart files to Spring Boot.
  const baseUrl = apiClient.defaults.baseURL;

  try {
    // We will extract the token from the auth store directly to be safe
    const { useAuthStore } = require('../store/use-auth-store');
    const actualToken = useAuthStore.getState().accessToken;

    const response = await fetch(`${baseUrl}/api/kyc/submit`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${actualToken}`,
        Accept: 'application/json',
        // NEVER set Content-Type manually for FormData in React Native fetch, 
        // it strips the boundary and crashes Spring Boot.
      },
      body: formData,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.text();
      } catch (e) {
        errorData = response.statusText;
      }
      throw new Error(`Upload Error: HTTP ${response.status} | Details: ${errorData}`);
    }

    return await response.json();
  } catch (error: any) {
    throw new Error(`Upload Network Error: ${error.message} (Likely Spring Boot limit or CORS)`);
  }
};

/**
 * Poll KYC approval status. Call GET /api/kyc/status.
 * Returns full onboarding state including profile, document statuses, and canUpload flag.
 */
const getKycStatus = async (): Promise<KycStatusResponse> => {
  const response = await apiClient.get<KycStatusResponse>('/api/kyc/status');
  return response.data;
};

export const kycService = {
  submitKyc,
  getKycStatus,
  needsUpload,
};
