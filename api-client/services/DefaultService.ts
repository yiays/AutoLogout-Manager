/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class DefaultService {
    /**
     * Get a client's state by uuid
     * @param uuid Target client UUID
     * @returns any Returns state for uuid if found
     * @throws ApiError
     */
    public static getStateFetch(
        uuid: string,
    ): CancelablePromise<{
        hashedPassword?: string;
        dailyTimeLimit: number;
        todayTimeLimit: number;
        usedTime?: number;
        usageDate: string;
        bedtime: string;
        waketime: string;
        graceGiven: boolean;
        syncAuthor?: string | null;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/get/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                401: `Unauthorized`,
                404: `State not found`,
            },
        });
    }
    /**
     * Authorize a secondary client
     * @param uuid Target client UUID
     * @param password Client's password
     * @returns any Generates a new auth key for this client
     * @throws ApiError
     */
    public static getClientAuthorize(
        uuid: string,
        password: string,
    ): CancelablePromise<{
        success: boolean;
        authKey: string;
    }> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/auth/{uuid}',
            path: {
                'uuid': uuid,
            },
            query: {
                'password': password,
            },
            errors: {
                401: `Unauthorized`,
                404: `Client not found`,
            },
        });
    }
    /**
     * Deauthorize all clients and delete stored data
     * @param uuid Target client UUID
     * @returns any Generates a new auth key for this client
     * @throws ApiError
     */
    public static deleteClientDeauthorize(
        uuid: string,
    ): CancelablePromise<{
        success: boolean;
    }> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/deauth/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                401: `Unauthorized`,
                404: `Client not found`,
            },
        });
    }
    /**
     * Create or update the client's state
     * @param uuid Target client UUID
     * @param parentMode Overrides values even if they are different from what you expected.
     * @param requestBody
     * @returns any Returns accepted if your changes were accepted, and any fields that might be different from your submission
     * @throws ApiError
     */
    public static postStateSync(
        uuid: string,
        parentMode?: boolean | null,
        requestBody?: {
            hashedPassword?: string;
            dailyTimeLimit?: number;
            todayTimeLimit?: number;
            usedTime?: number;
            usageDate?: string;
            bedtime?: string;
            waketime?: string;
            graceGiven?: boolean;
            syncAuthor?: string | null;
        },
    ): CancelablePromise<{
        accepted: boolean;
        delta?: {
            hashedPassword?: string;
            dailyTimeLimit?: number;
            todayTimeLimit?: number;
            usedTime?: number;
            usageDate?: string;
            bedtime?: string;
            waketime?: string;
            graceGiven?: boolean;
            syncAuthor?: string | null;
        };
    }> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/sync/{uuid}',
            path: {
                'uuid': uuid,
            },
            query: {
                'parentMode': parentMode,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Unauthorized`,
            },
        });
    }
}
