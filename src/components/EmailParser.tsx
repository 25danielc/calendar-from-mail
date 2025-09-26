import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Mail, Download, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface EventDetails {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
}

const EmailParser = () => {
  const [emailContent, setEmailContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedEvent, setParsedEvent] = useState<EventDetails | null>(null);

  const parseEmail = async () => {
    if (!emailContent.trim()) {
      toast({
        title: "Email content required",
        description: "Please paste your email content to parse",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    // Simulate parsing with timeout for demo
    setTimeout(() => {
      const event = extractEventFromEmail(emailContent);
      setParsedEvent(event);
      setIsLoading(false);
      
      if (event) {
        toast({
          title: "Event parsed successfully!",
          description: "Your calendar event is ready",
        });
      }
    }, 1500);
  };

  const extractEventFromEmail = (content: string): EventDetails => {
    // Basic email parsing logic - can be enhanced with AI later
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    // Extract title (often in subject or first significant line)
    const titleMatch = content.match(/subject:\s*(.+)/i) || content.match(/re:\s*(.+)/i);
    const title = titleMatch ? titleMatch[1].trim() : lines[0] || 'Untitled Event';
    
    // Extract date patterns
    const datePatterns = [
      /(\w+,?\s+\w+\s+\d{1,2},?\s+\d{4})/gi,
      /(\d{1,2}\/\d{1,2}\/\d{4})/g,
      /(\d{1,2}-\d{1,2}-\d{4})/g,
    ];
    
    let date = '';
    for (const pattern of datePatterns) {
      const match = content.match(pattern);
      if (match) {
        date = match[0];
        break;
      }
    }
    
    // Extract time patterns
    const timePattern = /(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)?)/gi;
    const timeMatch = content.match(timePattern);
    const time = timeMatch ? timeMatch[0] : '';
    
    // Extract location (look for common location indicators)
    const locationPatterns = [
      /(?:at|@|location:)\s*(.+?)(?:\n|$)/gi,
      /(?:address:)\s*(.+?)(?:\n|$)/gi,
    ];
    
    let location = '';
    for (const pattern of locationPatterns) {
      const match = content.match(pattern);
      if (match) {
        location = match[1].trim();
        break;
      }
    }
    
    return {
      title: title.substring(0, 100),
      date: date || 'Date not found',
      time: time || 'Time not found',
      location: location || 'Location not specified',
      description: content.substring(0, 200) + '...',
    };
  };

  const generateGoogleCalendarUrl = (event: EventDetails) => {
    const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
    const params = new URLSearchParams({
      text: event.title,
      dates: formatDateForGoogle(event.date, event.time),
      details: event.description,
      location: event.location,
    });
    
    return `${baseUrl}&${params.toString()}`;
  };

  const formatDateForGoogle = (date: string, time: string) => {
    // This is a simplified version - would need proper date parsing in production
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = '120000'; // Default to 12:00 PM
    return `${dateStr}T${timeStr}/${dateStr}T140000`; // 2 hour event
  };

  const downloadICS = (event: EventDetails) => {
    const icsContent = generateICSFile(event);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Calendar file downloaded",
      description: "Import the .ics file to your calendar app",
    });
  };

  const generateICSFile = (event: EventDetails) => {
    const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Email to Calendar//EN
BEGIN:VEVENT
DTSTART:${now}
DTEND:${now}
SUMMARY:${event.title}
DESCRIPTION:${event.description}
LOCATION:${event.location}
CREATED:${now}
DTSTAMP:${now}
END:VEVENT
END:VCALENDAR`;
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-gradient-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-medium mb-6 shadow-glow">
            <Mail className="w-4 h-4" />
            Email to Calendar
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Convert Emails to
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Calendar Events</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Paste your email content and we'll extract event details to create calendar entries automatically
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Input Section */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Email Content
              </CardTitle>
              <CardDescription>
                Paste the email containing event information below
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste your email content here...

Example:
Subject: Team Meeting Tomorrow
Hi everyone, we have a team meeting scheduled for tomorrow, March 15th at 2:00 PM in Conference Room A. We'll be discussing the Q2 roadmap and project updates."
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="min-h-[300px] resize-none"
              />
              <Button 
                onClick={parseEmail}
                disabled={isLoading || !emailContent.trim()}
                className="w-full bg-gradient-primary hover:shadow-elegant transition-all duration-300"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Parsing Email...
                  </>
                ) : (
                  <>
                    <Calendar className="w-4 h-4 mr-2" />
                    Parse Email
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="shadow-card animate-slide-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Event Details
              </CardTitle>
              <CardDescription>
                Extracted calendar event information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {parsedEvent ? (
                <div className="space-y-6 animate-fade-in">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground mb-2">{parsedEvent.title}</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          <span>{parsedEvent.date}</span>
                        </div>
                        {parsedEvent.time && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{parsedEvent.time}</span>
                          </div>
                        )}
                        {parsedEvent.location && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="w-4 h-4" />
                            <span>{parsedEvent.location}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        {parsedEvent.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => window.open(generateGoogleCalendarUrl(parsedEvent), '_blank')}
                      className="flex-1 bg-gradient-primary hover:shadow-elegant transition-all duration-300"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Add to Google Calendar
                    </Button>
                    <Button 
                      onClick={() => downloadICS(parsedEvent)}
                      variant="outline"
                      className="flex-1 hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download .ics
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No event parsed yet</p>
                  <p className="text-sm">Paste your email content and click "Parse Email" to get started</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Features */}
        <div className="mt-16 grid md:grid-cols-3 gap-6 animate-fade-in">
          <Card className="text-center shadow-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Smart Parsing</h3>
              <p className="text-sm text-muted-foreground">
                Automatically extracts event details from any email format
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Multi-Platform</h3>
              <p className="text-sm text-muted-foreground">
                Works with Google Calendar, Outlook, Apple Calendar, and more
              </p>
            </CardContent>
          </Card>
          
          <Card className="text-center shadow-card hover:shadow-elegant transition-all duration-300">
            <CardContent className="pt-6">
              <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Time Saving</h3>
              <p className="text-sm text-muted-foreground">
                Convert emails to calendar events in seconds, not minutes
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailParser;