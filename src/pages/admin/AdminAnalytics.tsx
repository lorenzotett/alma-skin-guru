import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#9a4a13', '#b55819', '#d16a22', '#e8822e', '#f4a261', '#e76f51'];

export default function AdminAnalytics() {
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [topConcerns, setTopConcerns] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>("30");
  const [totalData, setTotalData] = useState<{
    totalProducts: number;
    totalRecommended: number;
    totalClicked: number;
  }>({ totalProducts: 0, totalRecommended: 0, totalClicked: 0 });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      // Calculate date range
      const useAllTime = timeRange === "all";
      const daysAgo = new Date();
      if (!useAllTime) {
        daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      }

      // Product Performance (filtered by timeframe)
      const { data: products } = await supabase
        .from('products')
        .select('id, name, times_recommended, times_clicked')
        .order('times_recommended', { ascending: false })
        .limit(10);

      const totalRecommended = products?.reduce((sum, p) => sum + p.times_recommended, 0) || 0;
      const totalClicked = products?.reduce((sum, p) => sum + p.times_clicked, 0) || 0;

      setTotalData({
        totalProducts: products?.length || 0,
        totalRecommended,
        totalClicked,
      });

      setProductPerformance(products?.map(p => ({
        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
        consigliati: p.times_recommended,
        cliccati: p.times_clicked,
      })) || []);

      // Age Distribution (filtered by timeframe)
      let ageQuery = supabase
        .from('contacts')
        .select('age')
        .not('age', 'is', null);
      
      if (!useAllTime) {
        ageQuery = ageQuery.gte('created_at', daysAgo.toISOString());
      }
      
      const { data: contactsWithAge } = await ageQuery;

      const ageGroups: { [key: string]: number } = {
        '18-25': 0,
        '26-35': 0,
        '36-45': 0,
        '46-55': 0,
        '56+': 0,
      };

      contactsWithAge?.forEach(contact => {
        const age = contact.age!;
        if (age >= 18 && age <= 25) ageGroups['18-25']++;
        else if (age >= 26 && age <= 35) ageGroups['26-35']++;
        else if (age >= 36 && age <= 45) ageGroups['36-45']++;
        else if (age >= 46 && age <= 55) ageGroups['46-55']++;
        else if (age >= 56) ageGroups['56+']++;
      });

      setAgeDistribution(Object.entries(ageGroups).map(([name, value]) => ({ name, value })));

      // Top Concerns (filtered by timeframe)
      let concernsQuery = supabase
        .from('contacts')
        .select('concerns')
        .not('concerns', 'is', null);
      
      if (!useAllTime) {
        concernsQuery = concernsQuery.gte('created_at', daysAgo.toISOString());
      }
      
      const { data: contactsWithConcerns } = await concernsQuery;

      const concernsCount: { [key: string]: number } = {};
      contactsWithConcerns?.forEach(contact => {
        contact.concerns?.forEach((concern: string) => {
          concernsCount[concern] = (concernsCount[concern] || 0) + 1;
        });
      });

      const topConcernsData = Object.entries(concernsCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8)
        .map(([name, count]) => ({ name, count }));

      setTopConcerns(topConcernsData);

    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in px-2 sm:px-0 pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">Analytics Dettagliate</h1>
          <p className="text-sm text-muted-foreground">Analisi approfondita delle performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-44 h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Ultima settimana</SelectItem>
            <SelectItem value="30">Ultimo mese</SelectItem>
            <SelectItem value="90">Ultimi 3 mesi</SelectItem>
            <SelectItem value="180">Ultimi 6 mesi</SelectItem>
            <SelectItem value="365">Ultimo anno</SelectItem>
            <SelectItem value="all">Tutti i dati</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card className="border-primary/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Prodotti Attivi</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{totalData.totalProducts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Totale Consigliati</p>
              <p className="text-2xl sm:text-3xl font-bold text-primary">{totalData.totalRecommended}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-primary/20 hover:shadow-lg transition-shadow">
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-muted-foreground">Totale Cliccati</p>
              <p className="text-2xl sm:text-3xl font-bold text-accent">{totalData.totalClicked}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance */}
      <Card className="border-primary/20 hover:shadow-lg transition-shadow">
        <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base sm:text-lg">Performance Prodotti</CardTitle>
            <p className="text-xs text-muted-foreground">Top 10 prodotti più consigliati</p>
          </div>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 pb-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart 
              data={productPerformance} 
              margin={{ top: 10, right: 10, left: -10, bottom: 100 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                angle={-45} 
                textAnchor="end" 
                height={120} 
                interval={0}
                tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                width={40}
                allowDecimals={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '2px solid hsl(var(--primary))',
                  borderRadius: '12px',
                  fontSize: '13px',
                  padding: '10px 14px',
                  fontWeight: '500',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
              />
              <Legend 
                wrapperStyle={{ fontSize: '12px', paddingTop: '10px', fontWeight: '500' }}
                iconType="circle"
              />
              <Bar 
                dataKey="consigliati" 
                fill="hsl(var(--primary))" 
                name="Consigliati" 
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
              <Bar 
                dataKey="cliccati" 
                fill="hsl(var(--accent))" 
                name="Cliccati" 
                radius={[6, 6, 0, 0]}
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-primary/20 hover:shadow-lg transition-shadow">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">Distribuzione Età</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center px-2 sm:px-6 pb-4">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={ageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={95}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '13px', fontWeight: '600' }}
                >
                  {ageDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '12px',
                    fontSize: '13px',
                    padding: '10px 14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-primary/20 hover:shadow-lg transition-shadow">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg">Preoccupazioni Principali</CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topConcerns} layout="vertical" margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  type="number" 
                  stroke="hsl(var(--muted-foreground))" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  allowDecimals={false}
                />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="hsl(var(--muted-foreground))" 
                  width={150}
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '2px solid hsl(var(--primary))',
                    borderRadius: '12px',
                    fontSize: '13px',
                    padding: '10px 14px',
                    fontWeight: '500',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                  }}
                  cursor={{ fill: 'hsl(var(--primary) / 0.05)' }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[0, 8, 8, 0]}
                  name="Conteggio"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
