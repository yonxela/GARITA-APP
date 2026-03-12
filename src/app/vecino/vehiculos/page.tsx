'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'
import { PageHeader } from '@/components/page-header'
import { Car } from 'lucide-react'
import type { Vehiculo } from '@/lib/types'
import { listVehiculosByUsuario } from '@/lib/firebase/repo'

export default function VecinoVehiculosPage() {
  const usuario = useAuthStore((s) => s.usuario)
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadVehiculos()
  }, [])

  async function loadVehiculos() {
    const data = await listVehiculosByUsuario(usuario!.id)
    setVehiculos(data)
    setLoading(false)
  }

  return (
    <div>
      <PageHeader
        title="Mis Vehículos"
        description="Vehículos registrados a tu nombre"
      />

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : vehiculos.length === 0 ? (
        <div className="bg-white rounded-2xl premium-shadow p-12 text-center">
          <Car className="w-16 h-16 text-gray-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">Sin vehículos registrados</h3>
          <p className="text-gray-400 text-sm mt-1">Contacta a tu administrador para registrar tus vehículos</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehiculos.map((v) => (
            <div key={v.id} className="bg-white rounded-2xl premium-shadow p-6 hover:premium-shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                  <Car className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-mono text-xl font-bold text-gray-900">{v.placa}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {v.marca && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Marca</span>
                    <span className="font-medium text-gray-900">{v.marca}</span>
                  </div>
                )}
                {v.modelo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Modelo</span>
                    <span className="font-medium text-gray-900">{v.modelo}</span>
                  </div>
                )}
                {v.color && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Color</span>
                    <span className="font-medium text-gray-900">{v.color}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
