import { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

export function setSwagger(app: INestApplication){
    const config = new DocumentBuilder()
        .setTitle('Training-app')
        .setVersion('1.0')
        .build();
        
    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory,{
        jsonDocumentUrl: 'swagger/json',
    });
}