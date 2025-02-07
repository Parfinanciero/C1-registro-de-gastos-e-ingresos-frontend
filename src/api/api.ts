export const sendBillData = async (data: any) => {
    const response = await fetch('https://tu-backend.com/api/bills', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        throw new Error('Error al enviar los datos');
    }

    return response.json();
};
