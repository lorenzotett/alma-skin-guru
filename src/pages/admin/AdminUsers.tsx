import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Eye, FileDown } from "lucide-react";
import { toast } from "sonner";
import { mkConfig, generateCsv, download } from 'export-to-csv';

interface Contact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  age: number | null;
  skin_type: string | null;
  concerns: string[] | null;
  product_type: string | null;
  additional_info: string | null;
  created_at: string;
  email_sent: boolean | null;
  email_opened_at: string | null;
  email_clicked_at: string | null;
  discount_code: string | null;
  conversation_id: string | null;
}

interface EmailLog {
  opened: boolean;
  clicked: boolean;
  opened_at: string | null;
  clicked_at: string | null;
}

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  image_url: string | null;
  product_url: string;
}

export default function AdminUsers() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [skinTypeFilter, setSkinTypeFilter] = useState<string>("all");
  const [emailStatusFilter, setEmailStatusFilter] = useState<string>("all");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [emailLog, setEmailLog] = useState<EmailLog | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [clickedProducts, setClickedProducts] = useState<Set<string>>(new Set());
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery, skinTypeFilter, emailStatusFilter]);

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Errore nel caricamento dei contatti");
    }
  };

  const filterContacts = () => {
    let filtered = [...contacts];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (contact) =>
          contact.name?.toLowerCase().includes(query) ||
          contact.email?.toLowerCase().includes(query) ||
          contact.phone?.includes(query)
      );
    }

    // Skin type filter
    if (skinTypeFilter !== "all") {
      filtered = filtered.filter((contact) => contact.skin_type === skinTypeFilter);
    }

    // Email status filter
    if (emailStatusFilter !== "all") {
      filtered = filtered.filter((contact) => {
        if (emailStatusFilter === "clicked") return contact.email_clicked_at !== null;
        if (emailStatusFilter === "opened") return contact.email_opened_at !== null && !contact.email_clicked_at;
        if (emailStatusFilter === "sent") return contact.email_sent && !contact.email_opened_at;
        if (emailStatusFilter === "not_sent") return !contact.email_sent;
        return true;
      });
    }

    setFilteredContacts(filtered);
    setCurrentPage(1);
  };

  const openDetailDrawer = async (contact: Contact) => {
    setSelectedContact(contact);
    setDetailDrawerOpen(true);

    // Fetch email log
    const { data: emailData } = await supabase
      .from('email_logs')
      .select('opened, clicked, opened_at, clicked_at')
      .eq('recipient_email', contact.email)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    setEmailLog(emailData || null);

    // Fetch recommended products
    const { data: contactProducts } = await supabase
      .from('contact_products')
      .select('product_id')
      .eq('contact_id', contact.id);

    if (contactProducts && contactProducts.length > 0) {
      const productIds = contactProducts.map(cp => cp.product_id);
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      setRecommendedProducts(products || []);
    } else {
      setRecommendedProducts([]);
    }

    // For clicked products tracking (would need additional tracking in the actual app)
    setClickedProducts(new Set());

    // Fetch conversation messages
    if (contact.conversation_id) {
      const { data: conversation } = await supabase
        .from('conversations')
        .select('messages')
        .eq('id', contact.conversation_id)
        .single();

      setConversationMessages(conversation?.messages || []);
    } else {
      setConversationMessages([]);
    }
  };

  const exportToCSV = () => {
    const csvConfig = mkConfig({
      fieldSeparator: ';',
      filename: `alma-users-${new Date().toISOString().split('T')[0]}`,
      useKeysAsHeaders: true,
    });

    const csvData = filteredContacts.map(contact => ({
      ID: contact.id,
      Nome: contact.name || '',
      Email: contact.email || '',
      Telefono: contact.phone || '',
      Età: contact.age || '',
      'Tipo Pelle': contact.skin_type || '',
      Concerns: contact.concerns?.join(', ') || '',
      'Prodotto Cercato': contact.product_type || '',
      'Info Aggiuntive': contact.additional_info || '',
      'Data Analisi': new Date(contact.created_at).toLocaleDateString('it-IT'),
      'Email Inviata': contact.email_sent ? 'Sì' : 'No',
      'Email Aperta': contact.email_opened_at ? 'Sì' : 'No',
      'Email Cliccata': contact.email_clicked_at ? 'Sì' : 'No',
      'Codice Sconto': contact.discount_code || '',
    }));

    const csv = generateCsv(csvConfig)(csvData);
    download(csvConfig)(csv);
    toast.success("CSV esportato con successo");
  };

  const exportUserJSON = () => {
    if (!selectedContact) return;
    
    const dataStr = JSON.stringify(selectedContact, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-${selectedContact.id}.json`;
    link.click();
    toast.success("Dati utente esportati");
  };

  const getEmailStatusBadge = (contact: Contact) => {
    if (contact.email_clicked_at) {
      return <Badge className="bg-green-500 hover:bg-green-600">Cliccata</Badge>;
    }
    if (contact.email_opened_at) {
      return <Badge className="bg-yellow-500 hover:bg-yellow-600">Aperta</Badge>;
    }
    if (contact.email_sent) {
      return <Badge className="bg-blue-500 hover:bg-blue-600">Inviata</Badge>;
    }
    return <Badge variant="outline">Non inviata</Badge>;
  };

  const paginatedContacts = filteredContacts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredContacts.length / itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary mb-2">Gestione Utenti</h1>
          <p className="text-muted-foreground">Totale: {filteredContacts.length} utenti</p>
        </div>
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="w-4 h-4" />
          Esporta CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca nome, email, telefono..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={skinTypeFilter} onValueChange={setSkinTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo Pelle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti i tipi</SelectItem>
              <SelectItem value="normal">Normale</SelectItem>
              <SelectItem value="dry">Secca</SelectItem>
              <SelectItem value="oily">Grassa</SelectItem>
              <SelectItem value="combination">Mista</SelectItem>
            </SelectContent>
          </Select>
          <Select value={emailStatusFilter} onValueChange={setEmailStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Stato Email" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tutti gli stati</SelectItem>
              <SelectItem value="clicked">Cliccata</SelectItem>
              <SelectItem value="opened">Aperta</SelectItem>
              <SelectItem value="sent">Inviata</SelectItem>
              <SelectItem value="not_sent">Non inviata</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utente</TableHead>
                <TableHead>Contatto</TableHead>
                <TableHead>Età</TableHead>
                <TableHead>Tipo Pelle</TableHead>
                <TableHead>Concerns</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedContacts.map((contact) => (
                <TableRow key={contact.id} className="cursor-pointer hover:bg-secondary/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {contact.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{contact.name || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{contact.email}</div>
                      <div className="text-muted-foreground">{contact.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>{contact.age || 'N/A'}</TableCell>
                  <TableCell>
                    {contact.skin_type && (
                      <Badge variant="secondary">{contact.skin_type}</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {contact.concerns?.slice(0, 2).map((concern, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {concern}
                        </Badge>
                      ))}
                      {contact.concerns && contact.concerns.length > 2 && (
                        <Badge variant="outline" className="text-xs">+{contact.concerns.length - 2}</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {new Date(contact.created_at).toLocaleDateString('it-IT')}
                  </TableCell>
                  <TableCell>{getEmailStatusBadge(contact)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetailDrawer(contact)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4 border-t">
          <p className="text-sm text-muted-foreground">
            Pagina {currentPage} di {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Precedente
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Successiva
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedContact && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-primary text-primary-foreground text-lg">
                      {selectedContact.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-xl">{selectedContact.name || 'Utente'}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {selectedContact.email}
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="info" className="mt-6">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="analysis">Analisi</TabsTrigger>
                  <TabsTrigger value="email">Email</TabsTrigger>
                  <TabsTrigger value="products">Prodotti</TabsTrigger>
                  <TabsTrigger value="chat">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{selectedContact.name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedContact.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefono</p>
                      <p className="font-medium">{selectedContact.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Età</p>
                      <p className="font-medium">{selectedContact.age || 'N/A'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Registrato</p>
                      <p className="font-medium">
                        {new Date(selectedContact.created_at).toLocaleString('it-IT')}
                      </p>
                    </div>
                  </div>
                  <Button onClick={exportUserJSON} variant="outline" className="w-full gap-2">
                    <FileDown className="w-4 h-4" />
                    Esporta Dati (JSON)
                  </Button>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Tipo Pelle</p>
                    {selectedContact.skin_type && (
                      <Badge className="text-base px-4 py-1">{selectedContact.skin_type}</Badge>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Concerns</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.concerns?.map((concern, idx) => (
                        <Badge key={idx} variant="secondary">{concern}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Prodotto Cercato</p>
                    <p className="font-medium">{selectedContact.product_type || 'N/A'}</p>
                  </div>
                  {selectedContact.additional_info && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Note</p>
                      <p className="text-sm bg-secondary/50 p-3 rounded-lg">
                        {selectedContact.additional_info}
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="email" className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Status Email</p>
                    {getEmailStatusBadge(selectedContact)}
                  </div>
                  {selectedContact.email_sent && (
                    <>
                      {emailLog?.opened && (
                        <div>
                          <p className="text-sm text-muted-foreground">Aperta il</p>
                          <p className="font-medium">
                            {emailLog.opened_at && new Date(emailLog.opened_at).toLocaleString('it-IT')}
                          </p>
                        </div>
                      )}
                      {emailLog?.clicked && (
                        <div>
                          <p className="text-sm text-muted-foreground">Cliccata il</p>
                          <p className="font-medium">
                            {emailLog.clicked_at && new Date(emailLog.clicked_at).toLocaleString('it-IT')}
                          </p>
                        </div>
                      )}
                      {selectedContact.discount_code && (
                        <div>
                          <p className="text-sm text-muted-foreground">Codice Sconto</p>
                          <Badge variant="secondary" className="text-base px-4 py-1">
                            {selectedContact.discount_code}
                          </Badge>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="products" className="space-y-4">
                  {recommendedProducts.length > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Prodotti consigliati: {recommendedProducts.length}
                      </p>
                      <div className="space-y-3">
                        {recommendedProducts.map((product) => (
                          <Card key={product.id} className="p-4">
                            <div className="flex gap-4">
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-20 h-20 object-cover rounded-lg"
                                />
                              )}
                              <div className="flex-1">
                                <p className="font-medium">{product.name}</p>
                                <p className="text-sm text-muted-foreground">{product.brand}</p>
                                <p className="text-sm font-medium text-primary mt-1">
                                  €{product.price.toFixed(2)}
                                </p>
                                {clickedProducts.has(product.id) && (
                                  <Badge className="mt-2 bg-green-500">Cliccato</Badge>
                                )}
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nessun prodotto consigliato
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="space-y-3">
                  {conversationMessages.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                      {conversationMessages.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.isBot
                                ? 'bg-secondary text-foreground'
                                : 'bg-primary text-primary-foreground'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.timestamp && (
                              <p className="text-xs opacity-70 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString('it-IT')}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nessuna conversazione disponibile
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
