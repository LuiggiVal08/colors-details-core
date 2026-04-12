class HttpClient {
    /**
     * Creates an instance of HttpClient.
     * @param {string} baseURL - Base URL for the API
     * @param {number} timeout - Timeout for the API requests
     * @param {boolean} debug - Enable debug mode
     */
    constructor(baseURL = '', timeout = 5000, debug = false) {
        this.baseURL = baseURL;
        this.timeout = timeout;
        this.debug = debug;
        this.retryCount = 3;
    }

    async #request(url, method, data = null, headers = {}, retries = this.retryCount) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeout);

        try {
            let requestUrl = this.baseURL + url;
            let options = { method, headers: { ...headers }, signal: controller.signal };

            if (data instanceof FormData) {
                options.body = data;
            } else if (data) {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(data);
            }

            // Aplicar interceptor de solicitud
            if (this.requestInterceptor && typeof this.requestInterceptor === 'function') {
                const modified = await this.requestInterceptor({ url: requestUrl, options });
                if (modified && modified.url && modified.options) {
                    requestUrl = modified.url;
                    options = modified.options;
                }
            }

            // Realizar la solicitud
            const response = await fetch(requestUrl, options);
            clearTimeout(timer);

            // Aplicar interceptor de respuesta
            if (this.responseInterceptor && typeof this.responseInterceptor === 'function') {
                await this.responseInterceptor(response);
            }

            // Intentar parsear JSON, si es posible
            const contentType = response.headers.get('content-type');
            const result = contentType && contentType.includes('application/json') ? await response.json() : null;

            if (!response.ok) {
                return {
                    status: response.status,
                    message: result?.message || `Error: ${response.statusText}`,
                    error: { isError: true, ...result, status: response.status },
                    data: result,
                };
            }

            if (this.debug) {
                console.log('✅ Request:', { url: requestUrl, status: response.status, data: result });
            }

            return { status: response.status, message: result?.message, error: false, data: result };
        } catch (error) {
            clearTimeout(timer);
            const errorMessage = error.name === 'AbortError' ? 'Request timeout exceeded' : error.message;

            if (this.debug) console.error('❌ Request failed:', errorMessage);

            if (retries > 0 && (error.name === 'AbortError' || error instanceof TypeError)) {
                console.warn(`🔄 Retrying... (${this.retryCount - retries + 1})`);
                return this.#request(url, method, data, headers, retries - 1);
            }

            return { status: 500, message: `Error de conexión - ${errorMessage}`, error: true, data: null };
        }
    }

    get(url, headers = {}, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        return this.#request(`${url}${queryString ? '?' + queryString : ''}`, 'GET', null, headers);
    }

    post(url, data, headers = {}) {
        return this.#request(url, 'POST', data, headers);
    }

    put(url, data, headers = {}) {
        return this.#request(url, 'PUT', data, headers);
    }

    patch(url, data, headers = {}) {
        return this.#request(url, 'PATCH', data, headers);
    }

    delete(url, headers = {}) {
        return this.#request(url, 'DELETE', null, headers);
    }

    setRequestInterceptor(interceptor) {
        this.requestInterceptor = interceptor;
    }

    setResponseInterceptor(interceptor) {
        this.responseInterceptor = interceptor;
    }

    setBaseURL(baseURL) {
        this.baseURL = baseURL;
    }

    setTimeout(timeout) {
        this.timeout = timeout;
    }

    setDebugMode(debug) {
        this.debug = debug;
    }
}

export default HttpClient;
