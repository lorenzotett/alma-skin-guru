import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const COLORS = ['#9a4a13', '#b55819', '#d16a22', '#e8822e', '#f4a261', '#e76f51'];

export default function AdminAnalytics() {
  const [emailMetrics, setEmailMetrics] = useState({
    sentRate: 0,
    openRate: 0,
    clickRate: 0,
  });
  const [productPerformance, setProductPerformance] = useState<any[]>([]);
  const [ageDistribution, setAgeDistribution] = useState<any[]>([]);
  const [topConcerns, setTopConcerns] = useState<any[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Email Metrics
      const { data: contacts } = await supabase
        .from('contacts')
        .select('email_sent, email_opened_at, email_clicked_at');

      const total = contacts?.length || 0;
      const sent = contacts?.filter(c => c.email_sent).length || 0;
      const opened = contacts?.filter(c => c.email_opened_at).length || 0;
      const clicked = contacts?.filter(c => c.email_clicked_at).length || 0;

      setEmailMetrics({
        sentRate: total > 0 ? Math.round((sent / total) * 100) : 0,
        openRate: sent > 0 ? Math.round((opened / sent) * 100) : 0,
        clickRate: sent > 0 ? Math.round((clicked / sent) * 100) : 0,
      });

      // Product Performance
      const { data: products } = await supabase
        .from('products')
        .select('id, name, times_recommended, times_clicked')
        .order('times_recommended', { ascending: false })
        .limit(10);

      setProductPerformance(products?.map(p => ({
        name: p.name.length > 20 ? p.name.substring(0, 20) + '...' : p.name,
        consigliati: p.times_recommended,
        cliccati: p.times_clicked,
      })) || []);

      // Age Distribution
      const { data: contactsWithAge } = await supabase
        .from('contacts')
        .select('age')
        .not('age', 'is', null);

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

      // Top Concerns
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
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-primary mb-2">Analytics</h1>
        <p className="text-muted-foreground">Statistiche e metriche dettagliate</p>
      </div>

      {/* Email Marketing Metrics */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Email Marketing</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{emailMetrics.sentRate}%</p>
                <p className="text-sm text-muted-foreground mt-2">Tasso Invio</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{emailMetrics.openRate}%</p>
                <p className="text-sm text-muted-foreground mt-2">Tasso Apertura</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{emailMetrics.clickRate}%</p>
                <p className="text-sm text-muted-foreground mt-2">Tasso Click</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Product Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Prodotti</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={productPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
              <Legend />
              <Bar dataKey="consigliati" fill="hsl(var(--primary))" name="Consigliati" />
              <Bar dataKey="cliccati" fill="hsl(var(--accent))" name="Cliccati" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuzione Età</CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={ageDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {ageDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Concerns</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topConcerns} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={150} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
