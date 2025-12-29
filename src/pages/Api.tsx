import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getLocalizationJSON } from '@/services/localizationApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Code, Download, Copy, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { SUPPORTED_LANGUAGES } from '@/types/localization';
import { supabase } from '@/integrations/supabase/client';
import { Application } from '@/types/application';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AppLayout } from '@/components/AppLayout';

export default function Api() {
  const [resourceType, setResourceType] = useState('SmartPhone_Picking_APP');
  const [cultureCode, setCultureCode] = useState('he-IL');
  const [jsonData, setJsonData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const fetchApplications = async () => {
      console.log('🔍 API Page - Fetching applications...');
      const { data, error } = await supabase
        .from('applications')
        .select('*')
        .order('application_name', { ascending: true });
      
      if (error) {
        console.error('❌ API Page - Error fetching applications:', error);
      } else {
        console.log('✅ API Page - Applications loaded:', data);
        setApplications(data || []);
        if (data && data.length > 0 && !resourceType) {
          setResourceType(data[0].application_code);
          console.log('📌 API Page - Default resource type set to:', data[0].application_code);
        }
      }
    };

    fetchApplications();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    console.log('🔄 API Page - Fetching data with:', { resourceType, cultureCode });
    try {
      const data = await getLocalizationJSON(resourceType, cultureCode);
      console.log('📊 API Page - Received data count:', data.length);
      const jsonString = JSON.stringify(data, null, 2);
      setJsonData(jsonString);
      toast.success('הנתונים נטענו בהצלחה');
    } catch (error) {
      toast.error('שגיאה בטעינת הנתונים');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [resourceType, cultureCode, isAuthenticated]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonData);
      setCopied(true);
      toast.success('הנתונים הועתקו ללוח');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('שגיאה בהעתקה');
    }
  };

  const handleDownload = () => {
    console.log('💾 Downloading JSON:', { 
      resourceType, 
      cultureCode, 
      dataLength: jsonData.length,
      firstChars: jsonData.substring(0, 200) 
    });
    const blob = new Blob([jsonData], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `localization_${resourceType}_${cultureCode}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('הקובץ הורד בהצלחה');
  };

  return (
    <AppLayout title="API" description="ייצוא נתוני תרגום בפורמט JSON">
      <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Code className="h-6 w-6" />
              <div>
                <CardTitle>API - ייצוא נתוני תרגום</CardTitle>
                <CardDescription>
                  ייצא את נתוני התרגום בפורמט JSON עבור אפליקציות מובייל
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="resourceType">סוג משאב</Label>
                <Select value={resourceType} onValueChange={setResourceType}>
                  <SelectTrigger id="resourceType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.length === 0 ? (
                      <SelectItem value="no_apps" disabled>
                        אין אפליקציות
                      </SelectItem>
                    ) : (
                      applications.map((app) => (
                        <SelectItem key={app.id} value={app.application_code}>
                          {app.application_name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cultureCode">שפה</Label>
                <Select value={cultureCode} onValueChange={setCultureCode}>
                  <SelectTrigger id="cultureCode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_LANGUAGES.filter(l => l.code !== 'ALL').map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={fetchData} disabled={isLoading}>
                {isLoading ? 'טוען...' : 'רענון נתונים'}
              </Button>
              <Button variant="outline" onClick={handleCopy} disabled={!jsonData}>
                {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                העתק
              </Button>
              <Button variant="outline" onClick={handleDownload} disabled={!jsonData}>
                <Download className="h-4 w-4 mr-2" />
                הורד JSON
              </Button>
            </div>

            {jsonData && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>תוצאה (JSON)</Label>
                  <Badge variant="outline" className="gap-2">
                    שפה נוכחית: {SUPPORTED_LANGUAGES.find(l => l.code === cultureCode)?.name || cultureCode}
                  </Badge>
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>שים לב:</strong> הקובץ שיורד יכיל את השפה המוצגת כאן ({SUPPORTED_LANGUAGES.find(l => l.code === cultureCode)?.name}). 
                    אם שינית שפה, לחץ "רענון נתונים" לפני ההורדה!
                  </AlertDescription>
                </Alert>
                <pre className="bg-muted p-4 rounded-md overflow-auto max-h-96 text-sm">
                  <code>{jsonData}</code>
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
    </AppLayout>
  );
}

