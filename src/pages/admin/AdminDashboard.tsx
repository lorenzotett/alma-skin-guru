import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, FileText, MousePointer, TrendingUp, Calendar, Download, RefreshCw } from "lucide-react";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const COLORS = ['#9a4a13', '#b55819', '#d16a22', '#e8822e'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    todayAnalyses: 0,
    emailOpenRate: 0,
    productClickRate: 0,
    growthRate: 0,
  });
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [skinTypeData, setSkinTypeData] = useState<any[]>([]);
  const [concernsData, setConcernsData] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<string>("7");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchDashboardData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const fetchDashboardData = async () => {
    try {
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

      // Fetch email stats
      const { data: emailLogs } = await supabase
        .from('email_logs')
        .select('opened, clicked');
      
      const totalEmails = emailLogs?.length || 0;
      const openedEmails = emailLogs?.filter(e => e.opened).length || 0;
      const clickedEmails = emailLogs?.filter(e => e.clicked).length || 0;
      
      const emailOpenRate = totalEmails > 0 ? Math.round((openedEmails / totalEmails) * 100) : 0;
      const productClickRate = totalEmails > 0 ? Math.round((clickedEmails / totalEmails) * 100) : 0;

      // Calculate growth rate
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
        emailOpenRate,
        productClickRate,
        growthRate,
      });

      // Fetch trends data based on selected time range
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeRange));
      
      const { data: contactsData } = await supabase
        .from('contacts')
        .select('created_at')
        .gte('created_at', daysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by day
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
    <div className="space-y-6 animate-fade-in">
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Dashboard Analytics</h1>
          <p className="text-muted-foreground">Panoramica in tempo reale del sistema</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[160px]">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Ultimi 7 giorni</SelectItem>
              <SelectItem value="14">Ultimi 14 giorni</SelectItem>
              <SelectItem value="30">Ultimo mese</SelectItem>
              <SelectItem value="90">Ultimi 3 mesi</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="hover:bg-primary/10"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* KPI Cards Enhanced */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} className="overflow-hidden border-primary/10 hover:shadow-xl transition-all hover:scale-[1.02] group">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                    {'trend' in card && (
                      <Badge variant="secondary" className={`text-xs ${card.trendColor}`}>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        {card.trend}
                      </Badge>
                    )}
                  </div>
                  <p className="text-3xl sm:text-4xl font-bold text-primary mb-1">{card.value}</p>
                  {'subtitle' in card && (
                    <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                  )}
                </div>
                <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                  <card.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card className="hover:shadow-xl transition-all border-primary/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-primary" />
                Trend Analisi
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {timeRange} giorni
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={trendsData}>
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
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    padding: '12px 16px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                  }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={3}
                  fill="url(#colorCount)"
                  dot={{ fill: 'hsl(var(--primary))', r: 5, strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 7, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skin Type Distribution */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Distribuzione Tipi di Pelle
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={skinTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {skinTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Concerns */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="w-5 h-5 text-primary" />
              Top 5 Preoccupazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={concernsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 11 }}
                  angle={-15}
                  textAnchor="end"
                  height={60}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--background))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="count" 
                  fill="hsl(var(--primary))" 
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Ultimi Contatti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-2 scrollbar-thin">
              {recentContacts.length > 0 ? (
                recentContacts.map((contact) => (
                  <div 
                    key={contact.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/70 transition-all cursor-pointer border border-transparent hover:border-primary/20"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{contact.name || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground truncate">{contact.email}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <Badge variant="secondary" className="mb-1">
                        {contact.skin_type || 'N/A'}
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {new Date(contact.created_at).toLocaleDateString('it-IT', { 
                          day: '2-digit', 
                          month: 'short' 
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
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
