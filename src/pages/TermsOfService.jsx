import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle, AlertTriangle, Scale, Shield, Mail } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0F1513] p-4 lg:p-8 pb-24 lg:pb-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#F4743B] to-[#D97706] rounded-3xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[32px] leading-[40px] font-bold text-[#F4F7F5] mb-2">Användarvillkor</h1>
          <p className="text-[14px] leading-[20px] text-[#B6C2BC]">Senast uppdaterad: {new Date().toLocaleDateString('sv-SE')}</p>
        </div>

        {/* Introduction */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#F4F7F5]">
              Välkommen till AllPlay UF! Genom att använda vår app godkänner du dessa användarvillkor. Läs dem noggrant.
            </p>
          </CardContent>
        </Card>

        {/* Acceptance */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-[#2BA84A]" />
              Godkännande av villkor
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Genom att skapa ett konto eller använda AllPlay UF, godkänner du att följa dessa villkor samt vår integritetspolicy. Om du inte accepterar villkoren, använd inte tjänsten.
            </p>
          </CardContent>
        </Card>

        {/* User Accounts */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#2BA84A]" />
              Användarkonton
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Kontoskapande</h3>
              <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
                <li>Du måste vara minst 13 år för att skapa ett konto</li>
                <li>Du måste ange korrekt och aktuell information</li>
                <li>Du ansvarar för att hålla din inloggningsinformation säker</li>
                <li>Du är ansvarig för all aktivitet på ditt konto</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Kontosäkerhet</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                Om du misstänker att någon har tillgång till ditt konto, meddela oss omedelbart. Vi ansvarar inte för förluster som uppstår på grund av obehörig åtkomst.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* User Behavior */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#F4743B]" />
              Användarbeteende och regler
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <p className="text-[14px] leading-[20px] text-[#F4F7F5] mb-2">
              Du samtycker till att INTE:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
              <li>Trakassera, hota eller diskriminera andra användare</li>
              <li>Fuska eller manipulera systemet (t.ex. falska resultat, ELO-manipulation)</li>
              <li>Publicera stötande, olagligt eller olämpligt innehåll</li>
              <li>Utgiva dig för att vara någon annan</li>
              <li>Använda appen för kommersiella syften utan tillstånd</li>
              <li>Försöka få obehörig åtkomst till systemet</li>
              <li>Använda automatiserade verktyg (bots) utan tillstånd</li>
              <li>Överträda någon annans immateriella rättigheter</li>
            </ul>

            <div className="mt-4 p-4 bg-[#F4743B]/10 border border-[#F4743B]/30 rounded-xl">
              <p className="text-[14px] leading-[20px] text-[#F4F7F5]">
                <strong>Observera:</strong> Överträdelser kan leda till varning, tillfällig avstängning eller permanent blockering.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Content Ownership */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Innehållsägande</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Ditt innehåll</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                Du behåller äganderätten till innehåll du publicerar (t.ex. lagnamn, logotyper, meddelanden, kommentarer). Genom att publicera innehåll ger du oss en icke-exklusiv, global licens att använda, visa och distribuera det i syfte att tillhandahålla tjänsten.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Vårt innehåll</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                AllPlay UF-appen, dess funktioner, design och varumärke ägs av oss och är skyddade av upphovsrätt och andra lagar. Du får inte kopiera, modifiera eller distribuera appens källkod utan tillstånd.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Intellectual Property */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Immateriella rättigheter</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Alla immateriella rättigheter i appen, inklusive men inte begränsat till design, text, grafik, logotyper och funktionalitet, tillhör AllPlay UF eller våra licensgivare. Obehörig användning är förbjuden.
            </p>
          </CardContent>
        </Card>

        {/* Disclaimers */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Ansvarsfriskrivningar</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">"I befintligt skick"</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                Appen tillhandahålls "i befintligt skick" utan garantier av något slag. Vi garanterar inte att tjänsten alltid kommer att vara tillgänglig, felfri eller säker.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Begränsning av ansvar</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                Vi ansvarar inte för eventuella skador eller förluster som uppstår från din användning av appen, inklusive men inte begränsat till dataskador, inkomstförlust eller fysiska skador under matcher.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-[#F4F7F5] mb-2">Användaransvar</h3>
              <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
                Du deltar i matcher på egen risk. AllPlay UF ansvarar inte för skador, olyckor eller tvister som uppstår under matcher eller andra aktiviteter organiserade genom appen.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Termination */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Uppsägning</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC] mb-4">
              Vi förbehåller oss rätten att när som helst och utan förvarning:
            </p>
            <ul className="list-disc list-inside space-y-2 text-[14px] leading-[20px] text-[#B6C2BC]">
              <li>Avsluta eller tillfälligt stänga av ditt konto om du bryter mot dessa villkor</li>
              <li>Ta bort innehåll som bryter mot reglerna</li>
              <li>Neka åtkomst till tjänsten</li>
            </ul>
            <p className="text-[14px] leading-[20px] text-[#B6C2BC] mt-4">
              Du kan när som helst avsluta ditt konto genom att kontakta oss.
            </p>
          </CardContent>
        </Card>

        {/* Governing Law */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5] flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#2BA84A]" />
              Tillämplig lag
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Dessa villkor regleras av svensk lag. Tvister ska lösas i svenska domstolar.
            </p>
          </CardContent>
        </Card>

        {/* Dispute Resolution */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Tvistlösning</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Om du har en tvist med oss, försök först att lösa den informellt genom att kontakta oss. Om detta misslyckas kan tvisten lösas genom medling eller skiljedom innan domstolsförfaranden inleds.
            </p>
          </CardContent>
        </Card>

        {/* Changes to Terms */}
        <Card className="bg-[#121715] border border-[#223029] rounded-[20px]">
          <CardHeader className="border-b border-[#223029]">
            <CardTitle className="text-[18px] leading-[24px] text-[#F4F7F5]">Ändringar i villkoren</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-[14px] leading-[20px] text-[#B6C2BC]">
              Vi kan uppdatera dessa villkor när som helst. Vi meddelar dig om väsentliga ändringar via appen eller e-post. Fortsatt användning av tjänsten efter ändringar innebär att du accepterar de nya villkoren.
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
              Om du har frågor om dessa användarvillkor, kontakta oss:
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