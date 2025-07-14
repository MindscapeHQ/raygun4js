import { RaygunPayload, RaygunStatic } from '../types/index';

// Test RaygunPayload interface
function testPayloadStructure(): void {
    const payload: RaygunPayload = {
        OccurredOn: new Date(),
        Details: {
            Error: {
                ClassName: 'Error',
                Message: 'Test error',
                StackTrace: []
            },
            Environment: {
                UtcOffset: 0,
                "User-Language": 'en-US',
                "Document-Mode": 11,
                "Browser-Width": 1920,
                "Browser-Height": 1080,
                "Screen-Width": 1920,
                "Screen-Height": 1080,
                "Color-Depth": 24,
                Browser: 'Chrome',
                "Browser-Name": 'Chrome',
                "Browser-Version": '120.0.0',
                Platform: 'Linux'
            },
            Client: {
                Name: 'raygun4js',
                Version: '3.1.3'
            },
            UserCustomData: {},
            Tags: [],
            Request: {
                Url: 'https://example.com',
                QueryString: '',
                Headers: {
                    "User-Agent": 'Mozilla/5.0',
                    Referer: 'https://example.com',
                    Host: 'example.com'
                }
            },
            Version: '1.0.0',
            User: {
                Identifier: 'test-user',
                IsAnonymous: false,
                Email: 'test@example.com',
                FullName: 'Test User',
                FirstName: 'Test',
                UUID: 'test-uuid'
            },
            GroupingKey: 'test-group',
            Breadcrumbs: [
                {
                    type: 'manual',
                    message: 'Test breadcrumb',
                    level: 'info',
                    metadata: { test: true }
                }
            ]
        }
    };
}

// Test that onBeforeSend callback can access and modify breadcrumbs
function testOnBeforeSendBreadcrumbAccess(): void {
    // Mock Raygun instance
    const raygun = {} as RaygunStatic;

    // This should compile without TypeScript errors
    raygun.onBeforeSend((payload: RaygunPayload) => {
        // Access breadcrumbs
        if (payload.Details.Breadcrumbs) {
            // Filter out sensitive breadcrumbs
            payload.Details.Breadcrumbs = payload.Details.Breadcrumbs.filter(breadcrumb => {
                return breadcrumb.message !== 'sensitive-operation';
            });

            // Sanitize breadcrumb messages
            payload.Details.Breadcrumbs = payload.Details.Breadcrumbs.map(breadcrumb => ({
                ...breadcrumb,
                message: breadcrumb.message?.replace(/password|secret|token/gi, '[REDACTED]')
            }));
        }

        return payload;
    });
}

export {
    testPayloadStructure,
    testOnBeforeSendBreadcrumbAccess,
};
