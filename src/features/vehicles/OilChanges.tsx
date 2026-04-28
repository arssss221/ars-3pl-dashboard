import { useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { vehicleSeeds } from './vehicleData';
import {
  getVehiclePersonDisplayName,
  getVehiclePersonSearchTokens,
} from './vehiclePeople';

type OilStatus = 'normal' | 'due' | 'overdue';

interface LayoutContext {
  searchTerm: string;
}

interface OilHistoryRecord {
  id: number;
  vehicleId: number;
  changeDate: string;
  recordedMileage: number;
}

const oilHistoryRecords: OilHistoryRecord[] = [
  { id: 1, vehicleId: 1, changeDate: '2026-03-12', recordedMileage: 48250 },
  { id: 2, vehicleId: 1, changeDate: '2025-12-01', recordedMileage: 43200 },
  { id: 3, vehicleId: 2, changeDate: '2026-01-20', recordedMileage: 73640 },
  { id: 4, vehicleId: 2, changeDate: '2025-10-18', recordedMileage: 70200 },
  { id: 5, vehicleId: 3, changeDate: '2026-02-10', recordedMileage: 21480 },
  { id: 6, vehicleId: 3, changeDate: '2025-11-20', recordedMileage: 19100 },
  { id: 7, vehicleId: 4, changeDate: '2025-11-14', recordedMileage: 118900 },
  { id: 8, vehicleId: 4, changeDate: '2025-08-02', recordedMileage: 113600 },
];

const statusStyles: Record<OilStatus, string> = {
  normal: 'bg-emerald-100 text-emerald-700',
  due: 'bg-yellow-100 text-yellow-700',
  overdue: 'bg-red-100 text-red-700',
};

const formatDate = (dateStr: string) => {
  const parsed = new Date(dateStr);
  if (Number.isNaN(parsed.getTime())) return '-';
  return parsed.toLocaleDateString('en-GB');
};

const getOilStatus = (
  secondLastMileage: number,
  interval: number,
  latestMileage: number
): OilStatus => {
  const dueMileage = secondLastMileage + interval;
  const normalLimit = dueMileage + 300;

  if (latestMileage < dueMileage) return 'due';
  if (latestMileage <= normalLimit) return 'normal';
  return 'overdue';
};

export default function OilChanges() {
  const outletContext = useOutletContext<LayoutContext | undefined>();
  const { i18n } = useTranslation();
  const searchTerm = outletContext?.searchTerm ?? '';

  const rows = useMemo(() => {
    const searchValue = searchTerm.toLowerCase().trim();

    return vehicleSeeds
      .map((vehicle) => {
        const records = oilHistoryRecords
          .filter((record) => record.vehicleId === vehicle.id)
          .sort(
            (a, b) =>
              new Date(b.changeDate).getTime() - new Date(a.changeDate).getTime()
          );
        const latest = records[0];
        const secondLast = records[1] ?? records[0];
        if (!latest || !secondLast) return null;

        const status = getOilStatus(
          secondLast.recordedMileage,
          vehicle.oilChangeInterval,
          latest.recordedMileage
        );

        return {
          id: latest.id,
          lastChangeDate: latest.changeDate,
          vehicleNumber: vehicle.vehicleNumber,
          driver: vehicle.driver,
          driverDisplayName: getVehiclePersonDisplayName(
            vehicle.driver,
            i18n.language
          ),
          driverSearchTokens: getVehiclePersonSearchTokens(vehicle.driver),
          recordedMileage: latest.recordedMileage,
          status,
        };
      })
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .filter((row) =>
        [row.vehicleNumber, row.driver, ...row.driverSearchTokens, row.status]
          .join(' ')
          .toLowerCase()
          .includes(searchValue)
      )
      .sort(
        (a, b) =>
          new Date(b.lastChangeDate).getTime() -
          new Date(a.lastChangeDate).getTime()
      );
  }, [i18n.language, searchTerm]);

  return (
    <div className="h-full overflow-auto p-4">
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Sl.
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Last Change Date
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Vehicle No.
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Driver
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Changed Mileage
                </th>
                <th className="sticky top-0 z-10 bg-slate-50 text-left px-4 py-2 text-xs font-semibold text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-bold text-slate-500">
                    {index + 1}
                  </td>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {formatDate(row.lastChangeDate)}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {row.vehicleNumber}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {row.driverDisplayName}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {row.recordedMileage}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full capitalize ${
                        statusStyles[row.status]
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {rows.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 text-sm">No oil change records</p>
          </div>
        )}
      </div>
    </div>
  );
}
