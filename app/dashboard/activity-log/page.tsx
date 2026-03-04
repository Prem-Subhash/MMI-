'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Clock, User, FileText, CheckCircle, AlertCircle } from 'lucide-react'

const MOCK_ACTIVITIES = [
  { id: 1, type: 'stage_update', user: 'CSR-1', description: 'Updated stage for John Doe to "Quote Sent"', time: '2 mins ago', status: 'success' },
  { id: 2, type: 'new_lead', user: 'Admin', description: 'New lead created: Jane Smith (Home Insurance)', time: '15 mins ago', status: 'success' },
  { id: 3, type: 'note_added', user: 'CSR-1', description: 'Added note to Michael Scott: "Client requested follow-up next week"', time: '1 hour ago', status: 'info' },
  { id: 4, type: 'email_sent', user: 'System', description: 'Automated reminder sent to Robert Baratheon', time: '3 hours ago', status: 'success' },
  { id: 5, type: 'error', user: 'System', description: 'Failed to send automated email to Cersei Lannister (Invalid Email)', time: '5 hours ago', status: 'error' },
  { id: 6, type: 'stage_update', user: 'Admin', description: 'Lead marked as "Completed": Arya Stark', time: 'Yesterday at 4:30 PM', status: 'success' },
  { id: 7, type: 'login', user: 'CSR-1', description: 'User login successful', time: 'Yesterday at 9:00 AM', status: 'info' },
]

export default function ActivityLogPage() {
  const router = useRouter()
  const [activities] = useState(MOCK_ACTIVITIES)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="text-emerald-500" size={18} />
      case 'error': return <AlertCircle className="text-red-500" size={18} />
      case 'info': return <Clock className="text-blue-500" size={18} />
      default: return <FileText className="text-gray-500" size={18} />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Activity Log</h1>
              <p className="text-gray-500 text-sm">Real-time history of all actions performed in the CRM</p>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-[#10B889] text-white rounded-lg shadow-sm">
            <Clock size={18} />
            <span className="font-medium">Last updated: Just now</span>
          </div>
        </div>

        {/* LOG CONTENT */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Activity</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {activities.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/80 transition-colors group">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(item.status)}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-gray-800 font-medium group-hover:text-[#2E5C85] transition-colors">
                        {item.description}
                      </p>
                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-400 font-mono mt-1 inline-block">
                        #{item.id} - {item.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <User size={14} />
                        </div>
                        <span className="text-gray-600 font-medium">{item.user}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{item.time}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-gray-50/50 border-t border-gray-100 text-center">
            <button className="text-[#2E5C85] font-semibold hover:underline text-sm transition-all focus:outline-none">
              View custom date range history
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
