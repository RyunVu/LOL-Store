import { statusColors, statusIcons, formatDate } from '../utils/ReportHelpers'
import AdminPagination from '../../../../components/pagination/AdminPagination'

export default function ReportTable({
  reports,
  loading,
  filters,
  setFilters,
  totalItems,
  selectedReports,
  onSelectAll,
  onSelectReport,
  onOpenReview,
  onOpenDetail,
  onOpenDelete,
}) {
  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
      {loading ? (
        <div className="p-12 text-center text-gray-400">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mb-2"></div>
          <p>Loading reports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="p-12 text-center text-gray-400">
          <p className="text-lg mb-2">No reports found</p>
          <p className="text-sm">All clear! No pending reports at the moment.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-900">
                <tr>
                  {/* Checkbox */}
                  <th className="px-6 py-4 text-left whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={reports.length > 0 && selectedReports.length === reports.length}
                      onChange={onSelectAll}
                      className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                  </th>
                  {[
                    'No', 'Reporter', 'Reason', 'Feedback',
                    'Status', 'Admin Note', 'Reported At', 'Reviewed At', 'Actions',
                  ].map((h) => (
                    <th
                      key={h}
                      className={`px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap ${
                        h === 'Actions' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-700">
                {reports.map((report, i) => (
                  <tr
                    key={report.id}
                    className={`hover:bg-gray-700/40 transition-colors ${
                      selectedReports.includes(report.id) ? 'bg-gray-700/20' : ''
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => onSelectReport(report.id)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                    </td>

                    {/* No */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm">
                      {(filters.pageNumber - 1) * filters.pageSize + i + 1}
                    </td>

                    {/* Reporter */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-white text-sm font-medium">{report.reporterName}</span>
                    </td>

                    {/* Reason */}
                    <td className="px-6 py-4">
                      <button onClick={() => onOpenDetail(report)} className="text-left group">
                        <p className="text-gray-300 text-sm max-w-xs line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {report.reason}
                        </p>
                        <span className="text-xs text-blue-500 group-hover:text-blue-400 mt-0.5 block">
                          View full ↗
                        </span>
                      </button>
                    </td>

                    {/* Feedback Content */}
                    <td className="px-6 py-4">
                      <button onClick={() => onOpenDetail(report)} className="text-left group max-w-xs">
                        <p className="text-gray-500 text-xs mb-0.5">by {report.feedbackUserName}</p>
                        <p className="text-gray-300 text-sm line-clamp-2 group-hover:text-blue-400 transition-colors">
                          {report.feedbackContent}
                        </p>
                      </button>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                          statusColors[report.status] ?? 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        <span>{statusIcons[report.status] ?? '?'}</span>
                        <span>{report.status}</span>
                      </span>
                    </td>

                    {/* Admin Note */}
                    <td className="px-6 py-4">
                      {report.adminNote ? (
                        <p className="text-gray-400 text-sm max-w-xs line-clamp-2 italic">
                          "{report.adminNote}"
                        </p>
                      ) : (
                        <span className="text-gray-600 text-sm">—</span>
                      )}
                    </td>

                    {/* Reported At */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm font-mono">
                      {formatDate(report.createdAt)}
                    </td>

                    {/* Reviewed At */}
                    <td className="px-6 py-4 whitespace-nowrap text-gray-400 text-sm font-mono">
                      {report.reviewedAt
                        ? formatDate(report.reviewedAt)
                        : <span className="text-gray-600">—</span>}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center gap-3">
                        <button
                          onClick={() => onOpenDetail(report)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          View
                        </button>

                        {report.status === 'Pending' ? (
                          <button
                            onClick={() => onOpenReview(report)}
                            className="text-yellow-400 hover:text-yellow-300 text-sm font-medium transition-colors"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-gray-600 text-sm">Reviewed</span>
                        )}

                        <button
                          onClick={() => onOpenDelete(report)}
                          className="text-red-500 hover:text-red-400 text-sm font-medium transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <AdminPagination
            filters={filters}
            totalItems={totalItems}
            setFilters={setFilters}
          />
        </>
      )}
    </div>
  )
}