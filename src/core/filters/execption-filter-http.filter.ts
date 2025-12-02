import { CustomException } from "./../exception/custom-exeception";
import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { AbstractHttpAdapter, HttpAdapterHost } from "@nestjs/core";
import { ThrottlerException } from "@nestjs/throttler";

@Catch()
export class ExceptionFilterHttpFilter implements ExceptionFilter {
  private readonly httpAdapter: AbstractHttpAdapter;
  protected readonly logger = new Logger();

  constructor(private readonly adapterHost: HttpAdapterHost) {
    this.httpAdapter = adapterHost.httpAdapter;
  }

  public catch(exception: any, host: ArgumentsHost) {
    const contextHttp = host.switchToHttp();
    const request = contextHttp.getRequest();
    const response = contextHttp.getResponse();

    // Evitar erro em ambiente de teste
    try {
      this.httpAdapter.setHeader(response, "X-Powered-By", "CBSecurity");
    } catch {
      // Ignorar erro em ambiente de teste
    }

    if (exception instanceof BadRequestException) {
      const resolver: any = exception;
      const status = 422;
      const body = resolver.getResponse();
      body.statusCode = status;
      return this.httpAdapter.reply(response, body, status);
    }

    if (exception instanceof ThrottlerException) {
      console.log(request.Ip);
      const status = exception.getStatus();
      const body = {
        statusCode: status,
        message: "Wait a moment to be able to make new requests.",
        error: "Too Many Requests",
      };
      try {
        this.httpAdapter.setHeader(
          response,
          "Content-Type",
          "application/json; charset=utf-8",
        );
      } catch {
        // Ignorar erro em ambiente de teste
      }
      return this.httpAdapter.reply(response, body, status);
    }

    if (exception instanceof CustomException) {
      const resolver: any = exception;
      const status =
        resolver.response?.status === undefined
          ? 500
          : resolver.response?.status;
      const body = resolver.response?.data;

      this.logger.error(`STATUS ${status}`, body);
      return this.httpAdapter.reply(response, body, status);
    }

    const { status, body } =
      exception instanceof HttpException
        ? {
            status:
              exception.getStatus() === undefined ? 500 : exception.getStatus(),
            body: exception.getResponse(),
          }
        : {
            status: HttpStatus.INTERNAL_SERVER_ERROR,
            body: {
              statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
              timestamp: new Date().getTime(),
              message: exception.message,
              path: request.path,
            },
          };

    return this.httpAdapter.reply(response, body, status);
  }
}
