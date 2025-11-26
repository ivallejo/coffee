import { NextResponse } from 'next/server';

const MIAPI_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo2MDUsImV4cCI6MTc2NDcyMDA2M30.ebXvkCWTqNUZXoS4KJzA8IypVNGH8Rcqq7oUHZV5GOQ';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const dni = searchParams.get('dni');

    if (!dni || dni.length !== 8) {
        return NextResponse.json({ error: 'DNI inválido' }, { status: 400 });
    }

    try {
        const response = await fetch(`https://miapi.cloud/v1/dni/${dni}`, {
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${MIAPI_TOKEN}`
            },
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            console.error('API Error:', data);
            return NextResponse.json({ error: data.error || 'DNI no encontrado' }, { status: 404 });
        }

        if (!data.success || !data.datos) {
            return NextResponse.json({ error: 'DNI no encontrado' }, { status: 404 });
        }

        // Mapear respuesta al formato que espera el frontend
        const result = {
            success: true,
            nombres: data.datos.nombres,
            apellidoPaterno: data.datos.ape_paterno,
            apellidoMaterno: data.datos.ape_materno,
            // Agregamos dirección ya que la API la devuelve
            direccion: data.datos.domiciliado?.direccion || '',
            ubigeo: data.datos.domiciliado?.ubigeo || '',
            distrito: data.datos.domiciliado?.distrito || '',
            provincia: data.datos.domiciliado?.provincia || '',
            departamento: data.datos.domiciliado?.departamento || ''
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error('Error fetching DNI:', error);
        return NextResponse.json({ error: 'Error al consultar el servicio' }, { status: 500 });
    }
}
