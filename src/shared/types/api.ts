// Tipos relacionados con llamadas API

export interface ApiError {
    message: string;
    code?: string;
    statusCode: number;
}

export interface RequestConfig {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    headers?: Record<string, string>;
    body?: unknown;
}

export interface ApiClientConfig {
    baseURL: string;
    timeout?: number;
    headers?: Record<string, string>;
}
