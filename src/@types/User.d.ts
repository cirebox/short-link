declare namespace ApiTypes {
  interface User {
    /**
     * ID único do usuário, gerado automaticamente em formato UUID.
     */
    id?: string;

    /**
     * Nome do usuário.
     */
    name: string;

    /**
     * Email do usuário, deve ser único no sistema.
     */
    email: string;

    /**
     * Senha do usuário, armazenada de forma criptografada.
     */
    password: string;

    /**
     * Data de criação do registro.
     */
    createdAt?: string | Date;

    /**
     * Data da última atualização do registro.
     */
    updatedAt?: string | Date;
  }

  interface UserListResponse {
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }
}
