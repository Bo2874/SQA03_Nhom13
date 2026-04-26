import { applyDecorators, Type } from "@nestjs/common";
import { ApiResponse as SwaggerApiResponse } from "@nestjs/swagger";
import { ApiResponse } from "../responses/api-response.interface";

export const ApiResponseDecorator = <T>(type?: Type<T>) => {
    return applyDecorators(
        SwaggerApiResponse({
            status: 200,
            description: "Success",
            schema: {
                allOf: [
                    { properties: { message: { type: "string" } } },
                    {
                        properties: {
                            result: type
                                ? {
                                      type: "object",
                                      $ref: `#/components/schemas/${type.name}`,
                                  }
                                : { type: "object" },
                        },
                    },
                ],
            },
        }),
        SwaggerApiResponse({ status: 400, description: "Bad Request" }),
        SwaggerApiResponse({ status: 401, description: "Unauthorized" }),
        SwaggerApiResponse({ status: 403, description: "Forbidden" }),
        SwaggerApiResponse({
            status: 500,
            description: "Internal Server Error",
        })
    );
};
