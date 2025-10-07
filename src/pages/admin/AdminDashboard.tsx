import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, Mail, MousePointer } from "lucide-react";
import { LineChart, Line, PieChart, Pie, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

const COLORS = ['#9a4a13', '#b55819', '#d16a22', '#e8822e'];

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalContacts: 0,
    todayAnalyses: 0,
    emailOpenRate: 0,
    productClickRate: 0,
  });
  const [trendsData, setTrendsData] = useState<any[]>([]);
  const [skinTypeData, setSkinTypeData] = useState<any[]>([]);
  const [concernsData, setConcernsData] = useState<any[]>([]);
  const [recentContacts, setRecentContacts] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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

      setStats({
        totalContacts: totalContacts || 0,
        todayAnalyses: todayAnalyses || 0,
        emailOpenRate,
        productClickRate,
      });

      // Fetch trends data (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { data: contactsLast7Days } = await supabase
        .from('contacts')
        .select('created_at')
        .gte('created_at', sevenDaysAgo.toISOString())
        .order('created_at', { ascending: true });

      // Group by day
      const trendsByDay: { [key: string]: number } = {};
      contactsLast7Days?.forEach(contact => {
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
    { title: "Contatti Totali", value: stats.totalContacts, icon: Users, color: "from-primary to-accent" },
    { title: "Analisi Oggi", value: stats.todayAnalyses, icon: FileText, color: "from-accent to-primary" },
    { title: "Email Aperte", value: `${stats.emailOpenRate}%`, icon: Mail, color: "from-primary to-accent" },
    { title: "Click Prodotti", value: `${stats.productClickRate}%`, icon: MousePointer, color: "from-accent to-primary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Panoramica generale del sistema</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => (
          <Card key={card.title} className="overflow-hidden border-primary/10 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{card.title}</p>
                  <p className="text-3xl font-bold text-primary mt-2">{card.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  <card.icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Analisi Ultimi 7 Giorni</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={trendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skin Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Tipi di Pelle</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={skinTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {skinTypeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Concerns */}
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={concernsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Contacts */}
        <Card>
          <CardHeader>
            <CardTitle>Ultimi 10 Contatti</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[250px] overflow-y-auto">
              {recentContacts.map((contact) => (
                <div key={contact.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                  <div>
                    <p className="font-medium text-sm">{contact.name || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{contact.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-primary">{contact.skin_type || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(contact.created_at).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
