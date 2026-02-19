'use client'

import {
  VEHICLE_PRIMARY_USE,
  ANNUAL_MILES_OPTIONS,
} from './constants'

type Vehicle = {
  make_model?: string
  primary_use?: string
  annual_miles?: string
}

type Props = {
  data: Vehicle[]
  onChange: (value: Vehicle[]) => void
  disabled?: boolean
}

export default function VehicleListForm({
  data = [],
  onChange,
  disabled = false,
}: Props) {
  const vehicles = data.length ? data : [{}]

  const updateVehicle = (
    index: number,
    field: keyof Vehicle,
    value: string
  ) => {
    const updated = [...vehicles]
    updated[index] = {
      ...updated[index],
      [field]: value,
    }
    onChange(updated)
  }

  const addVehicle = () => {
    onChange([...vehicles, {}])
  }

  const removeVehicle = (index: number) => {
    const updated = vehicles.filter((_, i) => i !== index)
    onChange(updated.length ? updated : [{}])
  }

  return (
    <div className="mb-10 border rounded">
      {/* SECTION HEADER */}
      <div className="bg-gray-200 px-4 py-2 font-semibold">
        VEHICLE INFORMATION
      </div>

      <div className="p-4 overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-sm">
              <th className="border px-3 py-2 text-left">
                Vehicle (Make + Model)
              </th>
              <th className="border px-3 py-2 text-left">
                Primary Use
              </th>
              <th className="border px-3 py-2 text-left">
                Estimated Annual Miles
              </th>
              {!disabled && (
                <th className="border px-3 py-2 text-center">
                  Action
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {vehicles.map((vehicle, index) => (
              <tr key={index}>
                {/* MAKE + MODEL */}
                <td className="border px-2 py-2">
                  <input
                    type="text"
                    value={vehicle.make_model || ''}
                    disabled={disabled}
                    onChange={e =>
                      updateVehicle(
                        index,
                        'make_model',
                        e.target.value
                      )
                    }
                    className="w-full border px-2 py-1 rounded"
                  />
                </td>

                {/* PRIMARY USE */}
                <td className="border px-2 py-2">
                  <select
                    value={vehicle.primary_use || ''}
                    disabled={disabled}
                    onChange={e =>
                      updateVehicle(
                        index,
                        'primary_use',
                        e.target.value
                      )
                    }
                    className="w-full border px-2 py-1 rounded"
                  >
                    <option value="">Select</option>
                    {VEHICLE_PRIMARY_USE.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>

                {/* ANNUAL MILES */}
                <td className="border px-2 py-2">
                  <select
                    value={vehicle.annual_miles || ''}
                    disabled={disabled}
                    onChange={e =>
                      updateVehicle(
                        index,
                        'annual_miles',
                        e.target.value
                      )
                    }
                    className="w-full border px-2 py-1 rounded"
                  >
                    <option value="">Select</option>
                    {ANNUAL_MILES_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </td>

                {/* ACTION */}
                {!disabled && (
                  <td className="border px-2 py-2 text-center">
                    <button
                      onClick={() => removeVehicle(index)}
                      className="text-red-600 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {!disabled && (
          <button
            onClick={addVehicle}
            className="mt-3 text-blue-600 text-sm"
          >
            + Add Vehicle
          </button>
        )}
      </div>
    </div>
  )
}
