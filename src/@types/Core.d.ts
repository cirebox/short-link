declare namespace Core {
  interface NestResponse {
    code?: number;
    headers?: object;
    message?: string;
    data?: any;
    service?: any;
    axios?: any;
  }

  interface NestResponseException {
    response: NestResponse;
  }

  interface ResponseData {
    code: number;
    message?: string;
    data?: any;
    meta?: { page: number; limit: number; total: number };
    pageDetail?: PaginationResult;
    sort?: any;
  }

  interface PaginationResult {
    number: number; // número da pagina
    size: number; //Registros retornados na pagina
    limit?: number; // Limit por pagina
    count?: number; // Total de registros
    nextPage?: boolean;
    totalPages?: number;
  }
}
