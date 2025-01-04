from django.http import JsonResponse

ALLOWED_ORIGINS = [
    "https://angocat-tools-staging-bf496a3bfc63.herokuapp.com/pitch-shifter/",
    "http://localhost:3000",  # 開発中のローカルホスト
]


class AllowOnlyFrontendMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        print("=" * 10)
        origin = request.headers.get("Origin")
        print(request.headers)
        # if origin and origin not in ALLOWED_ORIGINS:
        #     return JsonResponse({"error": "Forbidden"}, status=403)
        return self.get_response(request)
