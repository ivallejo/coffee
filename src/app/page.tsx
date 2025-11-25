import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Coffee, Check, ArrowRight, BarChart3, Users, Shield, Zap, LayoutDashboard, MessageCircle, Smartphone, Receipt, Store } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-gray-900">
      {/* Navbar - Clean White */}
      <header className="sticky top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-[#6025C0] text-white p-1.5 rounded-lg">
              <Coffee className="h-6 w-6" />
            </div>
            <span className="font-bold text-2xl tracking-tight text-[#6025C0]">
              Coffee POS
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-600">
            <Link href="#features" className="hover:text-[#6025C0] transition-colors">Características</Link>
            <Link href="#benefits" className="hover:text-[#6025C0] transition-colors">Beneficios</Link>
            <Link href="#pricing" className="hover:text-[#6025C0] transition-colors">Planes</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button className="bg-[#6025C0] hover:bg-[#4c1d95] text-white font-bold rounded-full px-6 shadow-md transition-transform hover:scale-105">
                Ingresar
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section - Clean & Bright */}
      <section className="relative pt-20 pb-32 lg:pt-32 overflow-hidden bg-white">
        {/* Subtle Background Blob */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-purple-50 rounded-full blur-3xl opacity-50 -z-10"></div>
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-orange-50 rounded-full blur-3xl opacity-50 -z-10"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-[#6025C0] text-sm font-bold border border-purple-100">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#6025C0] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#6025C0]"></span>
                </span>
                Sistema de Facturación Electrónica
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] text-gray-900">
                Gestiona tu Cafetería <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6025C0] to-[#9333EA]">
                  Sin Complicaciones
                </span>
              </h1>

              <p className="text-xl text-gray-500 max-w-lg leading-relaxed font-medium">
                Controla ventas, inventario, recetas y clientes desde una sola plataforma. Diseñado específicamente para el rubro gastronómico.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login">
                  <Button size="lg" className="bg-[#6025C0] hover:bg-[#4c1d95] text-white h-14 px-8 rounded-full text-lg font-bold w-full sm:w-auto shadow-xl transition-transform hover:scale-105">
                    Empezar Gratis
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="https://wa.me/51990051584" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="lg" className="h-14 px-8 rounded-full text-lg font-bold w-full sm:w-auto border-2 border-gray-200 text-gray-600 hover:border-[#6025C0] hover:text-[#6025C0] bg-white">
                    Ver Demo
                  </Button>
                </a>
              </div>

              <div className="pt-8 flex items-center gap-8 text-sm font-medium text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-1 rounded-full">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="bg-green-100 p-1 rounded-full">
                    <Check className="h-4 w-4 text-green-600" />
                  </div>
                  <span>Instalación inmediata</span>
                </div>
              </div>
            </div>

            <div className="relative lg:h-[600px] w-full flex items-center justify-center hidden lg:flex">
              {/* Hero Illustration - Clean Shadow Style */}
              <div className="relative w-full max-w-lg perspective-1000">
                {/* Main Dashboard Card */}
                <div className="relative bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden border border-gray-100 transform rotate-y-6 rotate-x-6 transition-transform hover:rotate-0 duration-700">
                  <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                      <div className="w-3 h-3 rounded-full bg-gray-200"></div>
                    </div>
                    <div className="text-xs font-bold text-gray-400">DASHBOARD</div>
                  </div>
                  <div className="p-8 grid gap-8">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-sm text-gray-500 font-bold mb-1">Ventas del Día</p>
                        <p className="text-4xl font-extrabold text-[#6025C0]">S/ 2,850.00</p>
                      </div>
                      <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 border border-green-100">
                        <Zap className="h-4 w-4" /> +15%
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg text-orange-500 shadow-sm border border-gray-100">
                            <Coffee className="h-5 w-5" />
                          </div>
                          <span className="font-bold text-gray-700">Cappuccino</span>
                        </div>
                        <span className="font-bold text-gray-900">124 ventas</span>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="bg-white p-2 rounded-lg text-purple-500 shadow-sm border border-gray-100">
                            <Store className="h-5 w-5" />
                          </div>
                          <span className="font-bold text-gray-700">Americano</span>
                        </div>
                        <span className="font-bold text-gray-900">98 ventas</span>
                      </div>
                    </div>

                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full w-3/4 bg-[#6025C0] rounded-full"></div>
                    </div>
                  </div>
                </div>

                {/* Floating Elements - Clean */}
                <div className="absolute -right-8 top-20 bg-white p-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] animate-bounce delay-1000 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-50 p-2 rounded-full text-green-600">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">Factura F001-230</p>
                      <p className="font-bold text-gray-900">Emitida con Éxito</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -left-8 bottom-20 bg-white p-4 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.08)] animate-bounce delay-700 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-50 p-2 rounded-full text-orange-500">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-bold">Nuevo Cliente</p>
                      <p className="font-bold text-gray-900">+50 Puntos</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section (Propaganda) */}
      <section id="benefits" className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">¿Por qué elegir Coffee POS?</h2>
            <p className="text-lg text-gray-500">
              Más que un punto de venta, somos tu aliado tecnológico para hacer crecer tu negocio.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              {
                icon: Smartphone,
                title: "100% Cloud",
                desc: "Accede desde cualquier dispositivo, en cualquier lugar. Tu información siempre segura."
              },
              {
                icon: Receipt,
                title: "Facturación SUNAT",
                desc: "Emisión ilimitada de comprobantes electrónicos validados por SUNAT."
              },
              {
                icon: BarChart3,
                title: "Reportes Reales",
                desc: "Toma decisiones basadas en datos. Conoce tus productos más vendidos."
              },
              {
                icon: Shield,
                title: "Soporte 24/7",
                desc: "Equipo de soporte dedicado para ayudarte en cada paso."
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all text-center group hover:-translate-y-1">
                <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-[#6025C0] mx-auto mb-5 group-hover:bg-[#6025C0] group-hover:text-white transition-colors">
                  <item.icon className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section Detailed */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
            <div className="order-2 md:order-1">
              <div className="bg-gray-50 p-8 rounded-[2rem] relative border border-gray-100 overflow-hidden">
                <div className="absolute -top-6 -left-6 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 text-[#6025C0] z-10">
                  <LayoutDashboard className="h-8 w-8" />
                </div>
                {/* CSS Illustration of Dashboard */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 w-full aspect-video flex flex-col gap-4">
                  <div className="flex gap-4">
                    <div className="w-1/3 h-24 bg-purple-50 rounded-lg p-3 flex flex-col justify-between">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-[#6025C0] shadow-sm"><Coffee className="h-4 w-4" /></div>
                      <div className="h-2 w-12 bg-purple-200 rounded"></div>
                    </div>
                    <div className="w-1/3 h-24 bg-orange-50 rounded-lg p-3 flex flex-col justify-between">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-orange-500 shadow-sm"><Store className="h-4 w-4" /></div>
                      <div className="h-2 w-12 bg-orange-200 rounded"></div>
                    </div>
                    <div className="w-1/3 h-24 bg-green-50 rounded-lg p-3 flex flex-col justify-between">
                      <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-green-500 shadow-sm"><Users className="h-4 w-4" /></div>
                      <div className="h-2 w-12 bg-green-200 rounded"></div>
                    </div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg border border-gray-100 p-3 flex items-end justify-between gap-2">
                    {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                      <div key={i} className="w-full bg-[#6025C0] rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2 space-y-6">
              <h3 className="text-3xl font-bold text-gray-900">Control Total de tu Inventario</h3>
              <p className="text-lg text-gray-500">
                Olvídate de las hojas de cálculo. Gestiona tus insumos, recetas y stock en tiempo real.
              </p>
              <ul className="space-y-4">
                {[
                  "Control de recetas y costos",
                  "Alertas de stock bajo",
                  "Gestión de proveedores",
                  "Movimientos de almacén"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                    <div className="bg-green-50 p-1 rounded-full">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h3 className="text-3xl font-bold text-gray-900">Fideliza a tus Clientes</h3>
              <p className="text-lg text-gray-500">
                Convierte clientes ocasionales en frecuentes con nuestro sistema de lealtad integrado.
              </p>
              <ul className="space-y-4">
                {[
                  "Acumulación de puntos por compra",
                  "Base de datos de clientes",
                  "Historial de consumo",
                  "Campañas personalizadas"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700 font-medium">
                    <div className="bg-green-50 p-1 rounded-full">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="bg-gray-50 p-8 rounded-[2rem] relative border border-gray-100 overflow-hidden">
                <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-lg border border-gray-100 text-[#6025C0] z-10">
                  <Users className="h-8 w-8" />
                </div>
                {/* CSS Illustration of Loyalty Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 w-full aspect-video flex flex-col justify-center gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#6025C0]/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>

                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-400">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="h-3 w-32 bg-gray-200 rounded mb-2"></div>
                      <div className="h-2 w-20 bg-gray-100 rounded"></div>
                    </div>
                  </div>

                  <div className="bg-[#6025C0] text-white p-4 rounded-xl shadow-lg shadow-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold opacity-80">PUNTOS ACUMULADOS</span>
                      <Coffee className="h-4 w-4 opacity-80" />
                    </div>
                    <div className="text-3xl font-bold">1,250</div>
                    <div className="mt-2 text-xs opacity-80">Nivel Oro</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planes Flexibles</h2>
            <p className="text-lg text-gray-500">Elige el plan que mejor se adapte a tu etapa de crecimiento.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-10 rounded-3xl bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all text-center">
              <h3 className="text-2xl font-bold text-gray-800 mb-2">Gratis</h3>
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-2xl font-bold text-gray-400">S/</span>
                <span className="text-6xl font-extrabold text-gray-900">0</span>
              </div>
              <p className="text-gray-500 mb-8 font-medium">Para pequeños negocios</p>

              <ul className="space-y-4 mb-10 text-gray-600 text-left pl-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" /> 200 Comprobantes/mes
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" /> 1 Usuario
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-500" /> Inventario Básico
                </li>
              </ul>

              <Link href="/login">
                <Button variant="outline" className="w-full rounded-full h-12 border-2 border-gray-200 text-gray-600 font-bold hover:border-[#6025C0] hover:text-[#6025C0] hover:bg-white">
                  Crear Cuenta
                </Button>
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-10 rounded-3xl bg-white border-2 border-[#6025C0] shadow-xl text-center relative overflow-hidden transform md:-translate-y-4">
              <div className="absolute top-4 right-4 bg-[#6025C0] text-white text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <h3 className="text-2xl font-bold text-[#6025C0] mb-2">Premium</h3>
              <div className="flex items-center justify-center gap-1 mb-4">
                <span className="text-2xl font-bold text-[#6025C0]">S/</span>
                <span className="text-6xl font-extrabold text-[#6025C0]">29</span>
              </div>
              <p className="text-gray-500 mb-8 font-medium">Para negocios en crecimiento</p>

              <ul className="space-y-4 mb-10 text-gray-600 text-left pl-8">
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#6025C0]" /> Comprobantes Ilimitados
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#6025C0]" /> Usuarios Ilimitados
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#6025C0]" /> Inventario Avanzado + Recetas
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#6025C0]" /> Sistema de Fidelización
                </li>
                <li className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-[#6025C0]" /> Soporte Prioritario WhatsApp
                </li>
              </ul>

              <Link href="/login">
                <Button className="w-full rounded-full h-12 bg-[#6025C0] hover:bg-[#4c1d95] text-white font-bold shadow-lg hover:shadow-xl transition-all">
                  Obtener Premium
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-block p-4 rounded-full bg-green-50 mb-6">
            <MessageCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">¿Necesitas ayuda para empezar?</h2>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            Nuestro equipo de soporte está listo para ayudarte a configurar tu cuenta y resolver todas tus dudas en tiempo real.
          </p>
          <a
            href="https://wa.me/51990051584"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white h-16 px-10 rounded-full text-xl font-bold shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
          >
            <MessageCircle className="h-8 w-8 fill-current" />
            Chatear con Soporte
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white text-gray-600 py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex flex-col items-center md:items-start gap-4">
              <div className="bg-[#6025C0] text-white p-3 rounded-xl inline-block">
                <Coffee className="h-8 w-8" />
              </div>
              <span className="font-bold text-2xl tracking-tight text-gray-900">
                Coffee POS
              </span>
              <p className="text-sm text-gray-500">
                Sistema integral para la gestión de cafeterías y restaurantes.
              </p>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-6">Producto</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#6025C0] transition-colors">Características</a></li>
              <li><a href="#" className="hover:text-[#6025C0] transition-colors">Planes</a></li>
              <li><a href="#" className="hover:text-[#6025C0] transition-colors">Hardware Compatible</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-6">Soporte</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#6025C0] transition-colors">Centro de Ayuda</a></li>
              <li><a href="#" className="hover:text-[#6025C0] transition-colors">Tutoriales</a></li>
              <li><a href="#" className="hover:text-[#6025C0] transition-colors">Contacto</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 text-lg mb-6">Legal</h4>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-[#6025C0] transition-colors">Términos y Condiciones</a></li>
              <li><a href="#" className="hover:text-[#6025C0] transition-colors">Privacidad</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-gray-100 text-center text-gray-400 text-sm">
          <p>© {new Date().getFullYear()} Coffee POS. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
