declare namespace ApiTypes {
  interface Url {
    /**
     * ID único da URL, gerado automaticamente em formato UUID.
     */
    id?: string;

    /**
     * URL original que foi encurtada.
     */
    originalUrl: string;

    /**
     * Código curto de 6 caracteres para acesso à URL.
     */
    shortCode: string;

    /**
     * Alias customizado opcional (3-30 caracteres, lowercase alphanumeric + hyphens/underscores).
     */
    alias?: string | null;

    /**
     * ID do usuário que criou a URL.
     */
    userId?: string | null;

    /**
     * Contador de acessos à URL.
     */
    accessCount?: number;

    /**
     * Data de criação do registro.
     */
    createdAt?: string | Date;

    /**
     * Data da última atualização do registro.
     */
    updatedAt?: string | Date;

    /**
     * Data de exclusão lógica (soft delete).
     */
    deletedAt?: string | Date | null;
  }

  interface UrlListResponse {
    data: Url[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
