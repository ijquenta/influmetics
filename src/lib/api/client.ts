// Cliente API base

import type { ApiClientConfig, RequestConfig, ApiError } from "@/shared/types/api";
import type { ApiResponse } from "@/shared/types/common.types";

const defaultConfig: ApiClientConfig = {
    baseURL: process.env.NEXT_PUBLIC_API_URL || "/api",
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
};

export class ApiClient {
    private config: ApiClientConfig;

    constructor(config: Partial<ApiClientConfig> = {}) {
        this.config = { ...defaultConfig, ...config };
    }

    private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<ApiResponse<T>> {
        const { method = "GET", headers = {}, body } = config;

        try {
            const url = `${this.config.baseURL}${endpoint}`;
            const response = await fetch(url, {
                method,
                headers: {
                    ...this.config.headers,
                    ...headers,
                },
                body: body ? JSON.stringify(body) : undefined,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const error: ApiError = {
                    message: data.message || "Error en la solicitud",
                    code: data.code,
                    statusCode: response.status,
                };
                throw error;
            }

            return {
                data: data as T,
                status: response.status,
            };
        } catch (error) {
            if (error instanceof Error && "statusCode" in error) {
                throw error;
            }
            throw {
                message: error instanceof Error ? error.message : "Error desconocido",
                statusCode: 500,
            } as ApiError;
        }
    }

    async get<T>(endpoint: string, headers?: Record<string, string>) {
        return this.request<T>(endpoint, { method: "GET", headers });
    }

    async post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
        return this.request<T>(endpoint, { method: "POST", body, headers });
    }

    async put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
        return this.request<T>(endpoint, { method: "PUT", body, headers });
    }

    async delete<T>(endpoint: string, headers?: Record<string, string>) {
        return this.request<T>(endpoint, { method: "DELETE", headers });
    }

    async patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
        return this.request<T>(endpoint, { method: "PATCH", body, headers });
    }
}

export const apiClient = new ApiClient();
