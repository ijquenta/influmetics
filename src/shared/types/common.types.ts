// Tipos comunes compartidos en toda la aplicación

export interface ApiResponse<T = unknown> {
    data?: T;
    error?: string;
    message?: string;
    status: number;
}

export interface PaginatedResponse<T> {
    data: T[];
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

export type Status = "active" | "inactive" | "pending" | "suspended";

export interface SelectOption {
    label: string;
    value: string;
}
