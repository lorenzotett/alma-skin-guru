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
  const [isLoading, setIsLoading] = useState(false);
  const itemsPerPage = 30;

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    filterContacts();
  }, [contacts, searchQuery, skinTypeFilter, emailStatusFilter]);

  const fetchContacts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name, email, phone, age, skin_type, concerns, product_type, additional_info, created_at, email_sent, email_opened_at, email_clicked_at, discount_code, conversation_id')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContacts(data || []);
      toast.success(`${data?.length || 0} utenti caricati`);
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Errore nel caricamento dei contatti");
    } finally {
      setIsLoading(false);
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
          <p className="text-muted-foreground">
            Totale: {filteredContacts.length} utenti
            {isLoading && " (caricamento...)"}
          </p>
        </div>
        <Button onClick={exportToCSV} className="gap-2" disabled={isLoading}>
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
      <Card className="shadow-lg">
        {isLoading ? (
          <div className="flex items-center justify-center p-12">
            <div className="text-center space-y-3">
              <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground">Caricamento utenti...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/30">
                    <TableHead className="font-semibold">Utente</TableHead>
                    <TableHead className="font-semibold">Contatto</TableHead>
                    <TableHead className="font-semibold hidden sm:table-cell">Età</TableHead>
                    <TableHead className="font-semibold">Tipo Pelle</TableHead>
                    <TableHead className="font-semibold hidden md:table-cell">Concerns</TableHead>
                    <TableHead className="font-semibold hidden lg:table-cell">Data</TableHead>
                    <TableHead className="font-semibold">Email</TableHead>
                    <TableHead className="font-semibold text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContacts.map((contact) => (
                    <TableRow key={contact.id} className="cursor-pointer hover:bg-secondary/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="hidden sm:flex">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {contact.name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{contact.name || 'N/A'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm space-y-0.5">
                          <div className="font-medium">{contact.email}</div>
                          <div className="text-muted-foreground text-xs">{contact.phone || '-'}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <span className="text-sm">{contact.age || '-'}</span>
                      </TableCell>
                      <TableCell>
                        {contact.skin_type ? (
                          <Badge variant="secondary" className="text-xs">
                            {contact.skin_type}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {contact.concerns?.slice(0, 2).map((concern, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {concern}
                            </Badge>
                          ))}
                          {contact.concerns && contact.concerns.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{contact.concerns.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">
                        {new Date(contact.created_at).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        {getEmailStatusBadge(contact)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDetailDrawer(contact)}
                          className="hover:bg-primary/10"
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
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4">
              <p className="text-sm text-muted-foreground">
                Pagina {currentPage} di {totalPages} • {filteredContacts.length} utenti totali
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
          </>
        )}
      </Card>

      {/* Detail Drawer */}
      <Sheet open={detailDrawerOpen} onOpenChange={setDetailDrawerOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          {selectedContact && (
            <>
              <SheetHeader className="pb-4 border-b">
                <SheetTitle className="flex items-center gap-3">
                  <Avatar className="w-14 h-14">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white text-xl font-bold">
                      {selectedContact.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <div className="text-xl font-bold">{selectedContact.name || 'Utente'}</div>
                    <div className="text-sm text-muted-foreground font-normal">
                      {selectedContact.email}
                    </div>
                  </div>
                </SheetTitle>
              </SheetHeader>

              <Tabs defaultValue="info" className="mt-6">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="info" className="text-xs sm:text-sm">Info</TabsTrigger>
                  <TabsTrigger value="analysis" className="text-xs sm:text-sm">Analisi</TabsTrigger>
                  <TabsTrigger value="email" className="text-xs sm:text-sm">Email</TabsTrigger>
                  <TabsTrigger value="products" className="text-xs sm:text-sm">Prodotti</TabsTrigger>
                  <TabsTrigger value="chat" className="text-xs sm:text-sm">Chat</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Card className="p-4 bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Nome</p>
                      <p className="font-semibold text-sm">{selectedContact.name || 'N/A'}</p>
                    </Card>
                    <Card className="p-4 bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Email</p>
                      <p className="font-semibold text-sm break-all">{selectedContact.email || 'N/A'}</p>
                    </Card>
                    <Card className="p-4 bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Telefono</p>
                      <p className="font-semibold text-sm">{selectedContact.phone || 'N/A'}</p>
                    </Card>
                    <Card className="p-4 bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Età</p>
                      <p className="font-semibold text-sm">{selectedContact.age || 'N/A'}</p>
                    </Card>
                    <Card className="p-4 bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Tipo Pelle</p>
                      <p className="font-semibold text-sm capitalize">{selectedContact.skin_type || 'N/A'}</p>
                    </Card>
                    <Card className="p-4 bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-1">Prodotto Cercato</p>
                      <p className="font-semibold text-sm">{selectedContact.product_type || 'N/A'}</p>
                    </Card>
                    <Card className="p-4 bg-secondary/30 sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Registrato</p>
                      <p className="font-semibold text-sm">
                        {new Date(selectedContact.created_at).toLocaleString('it-IT')}
                      </p>
                    </Card>
                  </div>
                  
                  {/* Concerns Section */}
                  {selectedContact.concerns && selectedContact.concerns.length > 0 && (
                    <div className="mt-4">
                      <Card className="p-4 bg-secondary/30">
                        <p className="text-xs text-muted-foreground mb-3">Preoccupazioni</p>
                        <div className="flex flex-wrap gap-2">
                          {selectedContact.concerns.map((concern, idx) => (
                            <Badge key={idx} variant="secondary" className="text-sm">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                      </Card>
                    </div>
                  )}
                  
                  {/* Additional Info */}
                  {selectedContact.additional_info && (
                    <div className="mt-4">
                      <Card className="p-4 bg-secondary/30">
                        <p className="text-xs text-muted-foreground mb-2">Informazioni Aggiuntive</p>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{selectedContact.additional_info}</p>
                      </Card>
                    </div>
                  )}
                  
                  <Button onClick={exportUserJSON} variant="outline" className="w-full gap-2 mt-4">
                    <FileDown className="w-4 h-4" />
                    Esporta Dati (JSON)
                  </Button>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4 mt-4">
                  <Card className="p-4 bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-2">Tipo Pelle</p>
                    {selectedContact.skin_type ? (
                      <Badge className="text-base px-4 py-2">{selectedContact.skin_type}</Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">N/A</span>
                    )}
                  </Card>
                  <Card className="p-4 bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-2">Preoccupazioni</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedContact.concerns && selectedContact.concerns.length > 0 ? (
                        selectedContact.concerns.map((concern, idx) => (
                          <Badge key={idx} variant="secondary" className="text-sm">
                            {concern}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-sm text-muted-foreground">Nessuna</span>
                      )}
                    </div>
                  </Card>
                  <Card className="p-4 bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-2">Prodotto Cercato</p>
                    <p className="font-semibold text-sm">{selectedContact.product_type || 'N/A'}</p>
                  </Card>
                  {selectedContact.additional_info && (
                    <Card className="p-4 bg-secondary/30">
                      <p className="text-xs text-muted-foreground mb-2">Note Aggiuntive</p>
                      <p className="text-sm leading-relaxed">
                        {selectedContact.additional_info}
                      </p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="email" className="space-y-4 mt-4">
                  <Card className="p-4 bg-secondary/30">
                    <p className="text-xs text-muted-foreground mb-2">Stato Email</p>
                    {getEmailStatusBadge(selectedContact)}
                  </Card>
                  {selectedContact.email_sent && (
                    <>
                      {emailLog?.opened && (
                        <Card className="p-4 bg-secondary/30">
                          <p className="text-xs text-muted-foreground mb-1">Email Aperta</p>
                          <p className="font-semibold text-sm">
                            {emailLog.opened_at && new Date(emailLog.opened_at).toLocaleString('it-IT')}
                          </p>
                        </Card>
                      )}
                      {emailLog?.clicked && (
                        <Card className="p-4 bg-secondary/30">
                          <p className="text-xs text-muted-foreground mb-1">Link Cliccato</p>
                          <p className="font-semibold text-sm">
                            {emailLog.clicked_at && new Date(emailLog.clicked_at).toLocaleString('it-IT')}
                          </p>
                        </Card>
                      )}
                      {selectedContact.discount_code && (
                        <Card className="p-4 bg-secondary/30">
                          <p className="text-xs text-muted-foreground mb-2">Codice Sconto</p>
                          <Badge variant="secondary" className="text-lg px-6 py-2 font-mono">
                            {selectedContact.discount_code}
                          </Badge>
                        </Card>
                      )}
                    </>
                  )}
                </TabsContent>

                <TabsContent value="products" className="space-y-4 mt-4">
                  {recommendedProducts.length > 0 ? (
                    <>
                      <p className="text-sm text-muted-foreground font-medium">
                        {recommendedProducts.length} prodotti consigliati
                      </p>
                      <div className="space-y-3">
                        {recommendedProducts.map((product) => (
                          <Card key={product.id} className="p-4 hover:shadow-md transition-shadow">
                            <div className="flex gap-4">
                              {product.image_url && (
                                <img
                                  src={product.image_url}
                                  alt={product.name}
                                  className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm mb-1">{product.name}</p>
                                <p className="text-xs text-muted-foreground mb-2">{product.brand}</p>
                                <p className="text-base font-bold text-primary">
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
                    <Card className="p-8 bg-secondary/30">
                      <p className="text-muted-foreground text-center">
                        Nessun prodotto consigliato
                      </p>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="chat" className="mt-4">
                  {conversationMessages.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {conversationMessages.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-[85%] p-3 rounded-2xl ${
                              msg.isBot
                                ? 'bg-secondary/70 text-foreground'
                                : 'bg-gradient-to-br from-primary to-accent text-white'
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                            {msg.timestamp && (
                              <p className="text-xs opacity-60 mt-1.5">
                                {new Date(msg.timestamp).toLocaleTimeString('it-IT', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card className="p-8 bg-secondary/30">
                      <p className="text-muted-foreground text-center">
                        Nessuna conversazione disponibile
                      </p>
                    </Card>
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
