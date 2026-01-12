import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, Share2, Clock, Mail } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#2BA84A] to-[#248232] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[32px] leading-[40px] font-bold text-[#F4F7F5] mb-2">Integritetspolicy</h1>
          <p className="text-[14px] leading-[20px] text-[#B6C2BC]">Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</p>
        </div>

        {/* Introduction */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#F4F7F5]">
              AllPlay UF värnar om din integritet. Denna integritetspolicy förklarar hur vi samlar in, använder, delar och skyddar din personliga information när du använder vår app.
            </p>
          </CardContent>
        </Card>

        {/* Who We Are */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#2BA84A]" />
              Vem vi är
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[14px] leading-[20px] text-[#F4F7F5]">
              AllPlay UF är en plattform för att hitta och organisera fotbollsmatcher och turneringar. Vi drivs på Base44-plattformen och är dedikerade till att skapa en säker och engagerande upplevelse för alla spelare.
            </p>
          </CardContent>
        </Card>

        {/* Data We Collect */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#2BA84A]" />
              Vilken data vi samlar in
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Personligt identifierbar information (PII)</h3>
              <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
                <li>Namn och e-postadress (för kontoregistrering)</li>
                <li>Profilbilder och användarnamn</li>
                <li>Stad och plats (för att hitta matcher i närheten)</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Platsdata</h3>
              <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
                <li>Arenors geografiska position (för kartvisning)</li>
                <li>Incheckningsplatser vid matcher (för närvarobekräftelse)</li>
                <li>Din ungefärliga plats (om du tillåter det) för att visa närliggande matcher</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Beteendedata och spelhistorik</h3>
              <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
                <li>Matchdeltagande och resultat</li>
                <li>MVP-röster och betyg från andra spelare</li>
                <li>ELO-ranking och lagstatistik</li>
                <li>Framsteg mot märken och uppdrag</li>
                <li>Mål och assist i cuper</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Kommunikation</h3>
              <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
                <li>Lagmeddelanden och chattar</li>
                <li>Feedbackinlägg och kommentarer</li>
                <li>Rapporterade problem eller moderationsärenden</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Teknisk data</h3>
              <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
                <li>IP-adress och enhetsinformation</li>
                <li>Användarens interaktioner med appen (via analyser)</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* How We Use Data */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#2BA84A]" />
              Hur vi använder din data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
              <li>För att tillhandahålla och förbättra tjänsten</li>
              <li>För att personifiera din upplevelse (t.ex. rekommendera matcher i närheten)</li>
              <li>För att möjliggöra sociala funktioner (vänner, lag, cuper)</li>
              <li>För att kommunicera med dig om matcher, notiser och uppdateringar</li>
              <li>För analys och förbättring av appens funktionalitet</li>
              <li>För att säkerställa säkerhet och förhindra missbruk</li>
            </ul>
          </CardContent>
        </Card>

        {/* How We Share Data */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#2BA84A]" />
              Hur vi delar din data
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Med andra användare</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                Din profilinformation, matchhistorik och statistik är synlig för andra användare i appen. Du kan kontrollera vad som delas i dina inställningar.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Med tredjepartsleverantörer</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC] mb-2">Vi använder följande tjänster:</p>
              <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
                <li><strong>Base44:</strong> Plattform för backend och datalagring</li>
                <li><strong>Firebase:</strong> För autentisering och notiser</li>
                <li><strong>Google Maps/Leaflet:</strong> För kartvisning</li>
                <li><strong>Analysverktyg:</strong> För att förstå hur appen används</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Vid lagkrav</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                Vi kan dela information om det krävs enligt lag eller för att skydda våra rättigheter.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Your Rights */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2BA84A]" />
              Dina rättigheter
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
              <li><strong>Tillgång:</strong> Du kan begära en kopia av din data</li>
              <li><strong>Rättelse:</strong> Du kan uppdatera eller korrigera din information</li>
              <li><strong>Radering:</strong> Du kan begära att din data raderas</li>
              <li><strong>Begränsning:</strong> Du kan begränsa hur vi använder din data</li>
              <li><strong>Portabilitet:</strong> Du kan få din data i ett maskinläsbart format</li>
              <li><strong>Invändning:</strong> Du kan invända mot viss databehandling</li>
            </ul>
          </CardContent>
        </Card>

        {/* Data Storage */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#2BA84A]" />
              Datalagring
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Vi lagrar din data så länge ditt konto är aktivt. Om du raderar ditt konto, tar vi bort din personliga information inom 30 dagar, förutom data som krävs för legala eller säkerhetsskäl.
            </p>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#2BA84A]" />
              Säkerhetsåtgärder
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Vi använder branschstandard säkerhetsåtgärder för att skydda din data, inklusive kryptering, säker autentisering och regelbundna säkerhetsgranskningar. Ingen metod är dock 100% säker.
            </p>
          </CardContent>
        </Card>

        {/* Children's Privacy */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Barns integritet</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Vår tjänst är inte avsedd för personer under 13 år. Vi samlar inte medvetet in information från barn. Om du är förälder och upptäcker att ditt barn har gett oss personlig information, kontakta oss så tar vi bort den.
            </p>
          </CardContent>
        </Card>

        {/* Changes */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Ändringar i policyn</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Vi kan uppdatera denna policy då och då. Vi meddelar dig om väsentliga ändringar via appen eller e-post. Fortsatt användning av tjänsten efter ändringar innebär att du accepterar den nya policyn.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#2BA84A]" />
              Kontakta oss
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC] mb-4">
              Om du har frågor om denna integritetspolicy eller vill utöva dina rättigheter, kontakta oss:
            </p>
            <div className="text-[14px] leading-[20px] text-[#F4F7F5]">
              <p>E-post: support@allplayuf.se</p>
              <p>Address: AllPlay UF, Sverige</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}