const API_BASE_URL = "http://127.0.0.1:8000/api/v1";


export async function predictFQI(data) {
    const response = await fetch(
        `${API_BASE_URL}/predict-fqi`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(data),
        }
    );

    if (!response.ok) {
        let message = "FQI prediction failed";

        try {
            const error = await response.json();

            if (error.detail) {
                message =
                    typeof error.detail === "string"
                        ? error.detail
                        : JSON.stringify(error.detail);
            }
        } catch {
            // Keep default message.
        }

        throw new Error(message);
    }

    return response.json();
}


export async function getModelInfo() {
    const response = await fetch(
        `${API_BASE_URL}/model-info`
    );

    if (!response.ok) {
        throw new Error(
            "Unable to retrieve model information"
        );
    }

    return response.json();
}