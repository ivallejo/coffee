import { NextResponse } from 'next/server';

const FACTILIZA_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzOTk0MyIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6ImNvbnN1bHRvciJ9.Ge5N1RUws5M2jBoKnid4Pn5Azb_Eax4EL-GwClhZgdk';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const ruc = searchParams.get('ruc');

    if (!ruc || ruc.length !== 11) {
        return NextResponse.json({ error: 'RUC inválido' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://api.factiliza.com/v1/ruc/info/${ruc}`, {
            headers: {
                'Authorization': `Bearer ${FACTILIZA_TOKEN}`
            },
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            console.error('API Error:', data);
            return NextResponse.json({ error: data.message || 'RUC no encontrado' }, { status: 404 });
        }

        const info = data.data;

        // Mapear respuesta
        const result = {
            success: true,
            ruc: info.numero,
            razon_social: info.nombre_o_razon_social,
            estado: info.estado,
            condicion: info.condicion,
            direccion: info.direccion || '',
            ubigeo: info.ubigeo_sunat || '',
            distrito: info.distrito || '',
            provincia: info.provincia || '',
            departamento: info.departamento || ''
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching RUC:', error);
        return NextResponse.json({ error: 'Error al consultar el servicio' }, { status: 500 });
    }
}
