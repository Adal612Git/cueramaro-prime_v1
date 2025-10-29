import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  // Interceptor sencillo para registrar tiempos de respuesta.
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      tap(() => {
        const diff = Date.now() - now;
        console.log(`Handled ${request.method} ${request.url} in ${diff}ms`);
      })
    );
  }
}
