import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import PieChart from "@/components/charts/PieChart";
import BarChart from "@/components/charts/BarChart";
import PicaFilterButtons from "@/components/PicaFilterButtons";
import StatusBadge from "@/components/StatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { PicaWithRelations } from "@shared/schema";

const Dashboard: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  // Fetch PICA statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/picas/stats"],
  });

  // Fetch PICA by department statistics
  const { data: deptStats, isLoading: deptStatsLoading } = useQuery({
    queryKey: ["/api/picas/stats/department"],
  });

  // Fetch PICA by project site statistics
  const { data: siteStats, isLoading: siteStatsLoading } = useQuery({
    queryKey: ["/api/picas/stats/site"],
  });

  // Fetch PICAs
  const { data: picas, isLoading: picasLoading } = useQuery<PicaWithRelations[]>({
    queryKey: ["/api/picas"],
  });

  // Filter PICAs by status
  const filteredPicas = React.useMemo(() => {
    if (!picas) return [];
    if (activeFilter === "all") return picas;
    return picas.filter((pica) => pica.status === activeFilter);
  }, [picas, activeFilter]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard PICA</h1>
        <div className="text-sm text-gray-700 font-medium">
          FILTER : CUSTOM RANGE
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* PICA Overview */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row">
              <div className="w-full md:w-1/2 flex items-center justify-center mb-4 md:mb-0">
                {statsLoading ? (
                  <Skeleton className="w-[200px] h-[200px] rounded-full" />
                ) : (
                  <PieChart
                    data={[stats?.progress || 0, stats?.complete || 0, stats?.overdue || 0]}
                    labels={["Progress", "Complete", "Overdue"]}
                    colors={["#2563eb", "#f97316", "#9ca3af"]}
                  />
                )}
              </div>
              <div className="w-full md:w-1/2 flex flex-col justify-center pl-0 md:pl-4">
                <div className="mb-2 text-lg font-medium">
                  Created : <span className="font-semibold">{stats?.total || 0}</span>
                </div>
                <div className="mb-2 text-lg font-medium">
                  Complete : <span className="font-semibold">{stats?.complete || 0}</span>
                </div>
                <div className="mb-2 text-lg font-medium">
                  Progress : <span className="font-semibold">{stats?.progress || 0}</span>
                </div>
                <div className="text-lg font-medium">
                  Overdue : <span className="font-semibold">{stats?.overdue || 0}</span>
                </div>
                <div className="mt-4 flex text-xs font-medium">
                  <div className="flex items-center mr-3">
                    <div className="w-3 h-3 bg-primary rounded-sm mr-1"></div>
                    <span>PROGRESS</span>
                  </div>
                  <div className="flex items-center mr-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-sm mr-1"></div>
                    <span>COMPLETE</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-gray-400 rounded-sm mr-1"></div>
                    <span>OVERDUE</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Department PICA Chart */}
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center text-sm">
                <div className="w-4 h-4 bg-primary mr-1"></div>
                <span className="mr-3">Progress</span>
                <div className="w-4 h-4 bg-orange-500 mr-1"></div>
                <span className="mr-3">Complete</span>
                <div className="w-4 h-4 bg-gray-400 mr-1"></div>
                <span>Overdue</span>
              </div>
            </div>
            {deptStatsLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <BarChart
                labels={deptStats?.map((d: any) => d.department) || []}
                datasets={[
                  {
                    label: "Progress",
                    data: deptStats?.map((d: any) => d.progress) || [],
                    backgroundColor: "#2563eb",
                  },
                  {
                    label: "Complete",
                    data: deptStats?.map((d: any) => d.complete) || [],
                    backgroundColor: "#f97316",
                  },
                  {
                    label: "Overdue",
                    data: deptStats?.map((d: any) => d.overdue) || [],
                    backgroundColor: "#9ca3af",
                  },
                ]}
                maxY={5}
              />
            )}
          </CardContent>
        </Card>

        {/* Project Site PICA Chart */}
        <Card>
          <CardContent className="p-4">
            {siteStatsLoading ? (
              <Skeleton className="w-full h-[200px]" />
            ) : (
              <BarChart
                labels={siteStats?.map((s: any) => s.site) || []}
                datasets={[
                  {
                    label: "Progress",
                    data: siteStats?.map((s: any) => s.progress) || [],
                    backgroundColor: "#2563eb",
                  },
                  {
                    label: "Complete",
                    data: siteStats?.map((s: any) => s.complete) || [],
                    backgroundColor: "#f97316",
                  },
                  {
                    label: "Overdue",
                    data: siteStats?.map((s: any) => s.overdue) || [],
                    backgroundColor: "#9ca3af",
                  },
                ]}
                maxY={6}
              />
            )}
          </CardContent>
        </Card>

        {/* Yearly Calendar Planning */}
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-3">Yearly Calendar Planning</h3>
            <p className="text-xs text-gray-500 mb-2">Keep your content concise and relevant</p>
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr>
                    <th className="py-2 px-1 bg-gray-100">Tasks</th>
                    <th className="py-2 px-1 bg-gray-100">01</th>
                    <th className="py-2 px-1 bg-gray-100">02</th>
                    <th className="py-2 px-1 bg-gray-100">03</th>
                    <th className="py-2 px-1 bg-gray-100">04</th>
                    <th className="py-2 px-1 bg-gray-100">05</th>
                    <th className="py-2 px-1 bg-gray-100">06</th>
                    <th className="py-2 px-1 bg-gray-100">07</th>
                    <th className="py-2 px-1 bg-gray-100">08</th>
                    <th className="py-2 px-1 bg-gray-100">09</th>
                    <th className="py-2 px-1 bg-gray-100">10</th>
                    <th className="py-2 px-1 bg-gray-100">11</th>
                    <th className="py-2 px-1 bg-gray-100">12</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="py-1 px-1 bg-red-600 text-white font-medium">Task 01</td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1"></td>
                  </tr>
                  <tr>
                    <td className="py-1 px-1 bg-red-600 text-white font-medium">Task 02</td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1 bg-red-500"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                  </tr>
                  <tr>
                    <td className="py-1 px-1 bg-orange-500 text-white font-medium">Task 03</td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1 bg-orange-400"></td>
                    <td className="py-1 px-1 bg-orange-400"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1 bg-orange-400"></td>
                    <td className="py-1 px-1 bg-orange-400"></td>
                    <td className="py-1 px-1 bg-orange-400"></td>
                    <td className="py-1 px-1"></td>
                  </tr>
                  <tr>
                    <td className="py-1 px-1 bg-gray-500 text-white font-medium">Task 04</td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1"></td>
                    <td className="py-1 px-1 bg-gray-400"></td>
                    <td className="py-1 px-1 bg-gray-400"></td>
                    <td className="py-1 px-1 bg-gray-400"></td>
                    <td className="py-1 px-1 bg-gray-400"></td>
                    <td className="py-1 px-1 bg-gray-400"></td>
                    <td className="py-1 px-1 bg-gray-400"></td>
                    <td className="py-1 px-1 bg-gray-400"></td>
                    <td className="py-1 px-1 bg-gray-400"></td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex text-xs">
              <div className="flex items-center mr-3">
                <div className="w-3 h-3 bg-red-600 mr-1"></div>
                <span>Done</span>
              </div>
              <div className="flex items-center mr-3">
                <div className="w-3 h-3 bg-orange-400 mr-1"></div>
                <span>In Progress</span>
              </div>
              <div className="flex items-center mr-3">
                <div className="w-3 h-3 bg-gray-400 mr-1"></div>
                <span>Planned</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 border border-gray-300 mr-1"></div>
                <span>Not Yet</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Person In Charge Monitor */}
      <div className="mt-6 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50">
          <h2 className="text-lg font-medium text-gray-800">
            Person In Charge Monitor
          </h2>
        </div>
        <div className="p-4">
          <PicaFilterButtons
            activeFilter={activeFilter}
            onFilterChange={(filter) => setActiveFilter(filter)}
          />
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-primary">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Task Progress
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    PIC
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {picasLoading ? (
                  Array(4)
                    .fill(0)
                    .map((_, i) => (
                      <tr key={i}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="w-full h-5" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="w-16 h-5" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Skeleton className="w-20 h-5" />
                        </td>
                      </tr>
                    ))
                ) : filteredPicas.length > 0 ? (
                  filteredPicas.map((pica) => (
                    <tr key={pica.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {pica.correctiveAction}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                        {pica.personInCharge?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <StatusBadge status={pica.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={3}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No PICAs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-center">
            <nav className="flex items-center space-x-1 text-sm">
              <a href="#" className="px-2 py-1 text-gray-500">
                Previous
              </a>
              <a href="#" className="px-2 py-1 bg-primary text-white rounded">
                1
              </a>
              <a
                href="#"
                className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded"
              >
                2
              </a>
              <a
                href="#"
                className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded"
              >
                3
              </a>
              <a
                href="#"
                className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded"
              >
                4
              </a>
              <a
                href="#"
                className="px-2 py-1 text-gray-700 hover:bg-gray-100 rounded"
              >
                5
              </a>
              <a href="#" className="px-2 py-1 text-gray-500">
                Next
              </a>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
