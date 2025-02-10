"use client"

import * as React from "react"
import { Cell, Label, Pie, PieChart, Sector, ResponsiveContainer } from "recharts"
import { PieSectorDataItem } from "recharts/types/polar/Pie"
import { neo4jClient } from "../../../../lib/neo4j/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartStyle, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const COLORS = ['#FF69B4', '#FFB6C1'];

export const AddressTypesChart = () => {
  const [data, setData] = React.useState<{ type: string; count: number }[]>([])
  const [totalAddresses, setTotalAddresses] = React.useState(0)
  const [activeType, setActiveType] = React.useState("EOA")

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await neo4jClient.getAddressTypes()
        console.log("Fetched address types:", result)

        const total = result.reduce((acc, curr) => acc + curr.count, 0)
        setData(result)
        setTotalAddresses(total)
      } catch (error) {
        console.error("Error fetching address types:", error)
      }
    }

    fetchData()
  }, [])

  const chartConfig = {
    count: {
      label: "Count",
    },
    ...data.reduce((acc, item, index) => {
      acc[item.type] = {
        label: item.type,
        color: COLORS[index % COLORS.length],
      }
      return acc
    }, {} as ChartConfig),
  }

  const activeIndex = React.useMemo(
    () => data.findIndex((item) => item.type === activeType),
    [activeType, data]
  )
  const types = React.useMemo(() => data.map((item) => item.type), [data])

  return (
    <Card data-chart="address-types" className="flex flex-col">
      <ChartStyle id="address-types" config={chartConfig} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Address Types</CardTitle>
          <CardDescription>EOA vs Contract</CardDescription>
        </div>
        <Select value={activeType} onValueChange={setActiveType}>
          <SelectTrigger
            className="ml-auto h-7 w-[130px] rounded-lg pl-2.5"
            aria-label="Select a value"
          >
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent align="end" className="rounded-xl">
            {types.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig]

              if (!config) {
                return null
              }

              return (
                <SelectItem
                  key={key}
                  value={key}
                  className="rounded-lg [&_span]:flex"
                >
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor: COLORS[types.indexOf(key) % COLORS.length],
                      }}
                    />
                    {config?.label}
                  </div>
                </SelectItem>
              )
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          id="address-types"
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[400px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent hideLabel />}
              />
              <Pie
                data={data}
                dataKey="count"
                nameKey="type"
                innerRadius={60}
                strokeWidth={5}
                activeIndex={activeIndex}
                activeShape={({
                  outerRadius = 0,
                  ...props
                }: PieSectorDataItem) => (
                  <g>
                    <Sector {...props} outerRadius={outerRadius + 10} />
                    <Sector
                      {...props}
                      outerRadius={outerRadius + 25}
                      innerRadius={outerRadius + 12}
                    />
                  </g>
                )}
              >
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {totalAddresses.toLocaleString()}
                          </tspan>
                          <tspan
                            x={viewBox.cx}
                            y={(viewBox.cy || 0) + 24}
                            className="fill-muted-foreground"
                          >
                            Addresses
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}