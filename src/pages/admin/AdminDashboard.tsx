import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, MousePointer, TrendingUp, Calendar, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { PieChart, Pie, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

const COLORS = ['#9a4513', '#b55819', '#d16a22', '#e8822e'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    todayAnalyses: 0,
    productClickRate: 0,
    growthRate: 0,
  });
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [skinTypeData, setSkinTypeData] = useState<any[]>([]);
  const [concernsData, setConcernsData] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>("7");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const useAllTime = timeRange === "all";
      
      // Fetch total contacts
      const { count: totalContacts } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true });

      // Fetch today's analyses
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayAnalyses } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      // Fetch product click rate from contact_products
      const { count: totalRecommendations } = await supabase
        .from('contact_products')
        .select('*', { count: 'exact', head: true });
      
      const { data: clickedProducts } = await supabase
        .from('products')
        .select('times_clicked');
      
      const totalClicks = clickedProducts?.reduce((sum, p) => sum + (p.times_clicked || 0), 0) || 0;
      const productClickRate = totalRecommendations && totalRecommendations > 0 
        ? Math.round((totalClicks / totalRecommendations) * 100) 
        : 0;

      // Growth rate calculation
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: last30Days } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      const { count: previous30Days } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const growthRate = previous30Days && previous30Days > 0
        ? Math.round(((last30Days || 0) - previous30Days) / previous30Days * 100)
        : 0;

      setStats({
        totalContacts: totalContacts || 0,
        todayAnalyses: todayAnalyses || 0,
        productClickRate,
        growthRate,
      });

      // Fetch trends data
      let contactsQuery = supabase
        .from('contacts')
        .select('created_at')
        .order('created_at', { ascending: true });
      
      if (!useAllTime) {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
        contactsQuery = contactsQuery.gte('created_at', daysAgo.toISOString());
      }
      
      const { data: contactsData } = await contactsQuery;

      const trendsByDay: { [key: string]: number } = {};
      contactsData?.forEach(contact => {
        const date = new Date(contact.created_at).toLocaleDateString('it-IT', { month: 'short', day: 'numeric' });
        trendsByDay[date] = (trendsByDay[date] || 0) + 1;
      });
      setTrendsData(Object.entries(trendsByDay).map(([date, count]) => ({ date, count })));

      // Fetch skin type distribution
      const { data: contacts } = await supabase
        .from('contacts')
        .select('skin_type')
        .not('skin_type', 'is', null);

      const skinTypes: { [key: string]: number } = {};
      contacts?.forEach(contact => {
        if (contact.skin_type) {
          skinTypes[contact.skin_type] = (skinTypes[contact.skin_type] || 0) + 1;
        }
      });
      setSkinTypeData(Object.entries(skinTypes).map(([name, value]) => ({ name, value })));

      // Fetch top concerns
      const { data: contactsWithConcerns } = await supabase
        .from('contacts')
        .select('concerns')
        .not('concerns', 'is', null);

      const concernsCount: { [key: string]: number } = {};
      contactsWithConcerns?.forEach(contact => {
        contact.concerns?.forEach((concern: string) => {
          concernsCount[concern] = (concernsCount[concern] || 0) + 1;
        });
      });
      
      const topConcerns = Object.entries(concernsCount)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));
      setConcernsData(topConcerns);

      // Fetch recent contacts
      const { data: recentContactsData } = await supabase
        .from('contacts')
        .select('id, name, email, skin_type, created_at')
        .order('created_at', { ascending: false })
        .limit(10);
      
      setRecentContacts(recentContactsData || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Errore nel caricamento dei dati");
    } finally {
      setIsLoading(false);
    }
  };

  const kpiCards = [
    { 
      title: "Contatti Totali", 
      value: stats.totalContacts, 
      icon: Users, 
      color: "from-primary to-accent",
      trend: `${stats.growthRate > 0 ? '+' : ''}${stats.growthRate}%`,
      trendColor: stats.growthRate >= 0 ? "text-green-600" : "text-red-600"
    },
    { 
      title: "Analisi Oggi", 
      value: stats.todayAnalyses, 
      icon: FileText, 
      color: "from-accent to-primary",
      subtitle: "nuove analisi"
    },
    { 
      title: "Click Prodotti", 
      value: `${stats.productClickRate}%`, 
      icon: MousePointer, 
      color: "from-primary to-accent",
      subtitle: "tasso conversione"
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 px-2 sm:px-0 pb-6">
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="animate-spin w-16 h-16 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-lg font-medium text-primary">Caricamento dashboard...</p>
          </div>
        </div>
      )}
      {/* Header - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Panoramica analytics</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-36 sm:w-40 h-9">
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
          <Button 
            variant="outline" 
            size="icon"
            className="h-9 w-9"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} className="hover:shadow-lg transition-shadow border-primary/10">
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">
                      {card.title}
                    </p>
                    {'trend' in card && (
                      <Badge variant="secondary" className={`text-xs ${card.trendColor}`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {card.trend}
                      </Badge>
                    )}
                  </div>
                  <p className="text-2xl sm:text-3xl font-bold text-primary truncate">
                    {card.value}
                  </p>
                  {'subtitle' in card && (
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {card.subtitle}
                    </p>
                  )}
                </div>
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                  <card.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid - Mobile Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Trends Chart */}
        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
                <span className="truncate">Analisi nel Tempo</span>
              </CardTitle>
              <Badge variant="outline" className="text-xs self-start sm:self-auto">
                {timeRange} giorni
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={trendsData} margin={{ top: 10, right: 15, left: 0, bottom: 10 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                angle={-20}
                textAnchor="end"
                height={60}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                width={45}
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
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="hsl(var(--primary))" 
                strokeWidth={3}
                fill="url(#colorCount)"
                dot={{ fill: 'hsl(var(--primary))', r: 4, strokeWidth: 2, stroke: '#fff' }}
                name="Analisi"
              />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skin Types - Mobile Optimized */}
        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="truncate">Tipi di Pelle</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={skinTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                  style={{ fontSize: '13px', fontWeight: '600' }}
                >
                  {skinTypeData.map((_, index) => (
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

        {/* Top Concerns - Mobile Optimized */}
        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <MousePointer className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="truncate">Top Preoccupazioni</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 sm:px-6 pb-4">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={concernsData} margin={{ top: 10, right: 15, left: 0, bottom: 70 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  angle={-40}
                  textAnchor="end"
                  height={100}
                  interval={0}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                  width={45}
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
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                  name="Conteggio"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Contacts - Mobile Optimized */}
        <Card className="hover:shadow-lg transition-shadow border-primary/10">
          <CardHeader className="px-4 sm:px-6 py-3 sm:py-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 text-primary flex-shrink-0" />
              <span className="truncate">Ultimi Contatti</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-4">
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {recentContacts.length > 0 ? (
                recentContacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="font-semibold text-sm sm:text-base truncate text-foreground">{contact.name || 'N/A'}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate mt-0.5">{contact.email}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <Badge variant="secondary" className="text-xs font-medium mb-1.5 px-2 py-0.5">
                        {contact.skin_type || 'N/A'}
                      </Badge>
                      <p className="text-xs font-medium text-muted-foreground">
                        {new Date(contact.created_at).toLocaleDateString('it-IT', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nessun contatto recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
