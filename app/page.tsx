"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeSwitcher } from "@/components/theme-switcher";
import {
  Mic,
  Upload,
  Brain,
  FileText,
  Users,
  Clock,
  Globe,
  Shield,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  Smartphone,
  FileAudio,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0, 0, 0.2, 1] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

function FAQItem({
  question,
  answer,
}: {
  question: string;
  answer: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border last:border-0">
      <button
        className="w-full flex justify-between items-center py-5 text-left font-medium hover:text-primary transition-colors"
        onClick={() => setOpen(!open)}
      >
        {question}
        {open ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground shrink-0" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="pb-5 text-muted-foreground leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="w-full flex justify-center border-b border-border/50 h-16 sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="w-full max-w-6xl flex justify-between items-center px-5">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <Mic className="h-5 w-5 text-primary" />
            <span>Хурлын Тэмдэглэл</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Button asChild variant="outline" size="sm">
              <Link href="/auth/login">Нэвтрэх</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Бүртгүүлэх</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 dark:from-primary/10 dark:to-primary/5" />
        <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="relative max-w-6xl mx-auto px-5 py-24 md:py-36">
          <motion.div
            className="text-center max-w-3xl mx-auto"
            initial="hidden"
            animate="visible"
            variants={stagger}
          >
            <motion.div variants={fadeInUp}>
              <Badge variant="secondary" className="mb-6 text-sm px-4 py-1.5">
                <Zap className="h-3.5 w-3.5 mr-1.5" />
                AI-Powered Mongolian Speech-to-Text
              </Badge>
            </motion.div>
            <motion.h1
              className="text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6"
              variants={fadeInUp}
            >
              Хурлын тэмдэглэлд цагаа үрэхээ боль.
              <br />
              <span className="text-primary">Монгол хэлээрх яриаг минутын дотор үнэн зөв буулгуул.</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Танд бичлэг эргүүлж сонсон, тэмдэглэл хөтлөхөөс чухал олон ажил бий. "Хурлын Тэмдэглэл" бол таны Монгол хэлээрх хурлыг автоматаар буулгаж, яригч бүрийг танин, цагийн тамгатай, төгс скриптийг бэлтгэдэг дэлхийн цорын ганц систем юм.
            </motion.p>
            <motion.p
              className="text-sm text-muted-foreground/70 mb-10"
              variants={fadeInUp}
            >
              The only tool in the world that automatically transcribes your Mongolian meetings, identifies every speaker, and delivers a perfect, time-stamped script.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/auth/sign-up">
                  Эхний буулгалтаа Үнэгүй Авах
                  <span className="text-xs opacity-80 ml-1">
                    — Get Your Free Transcript Now
                  </span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="#how-it-works">Хэрхэн Ажилладагийг Харах</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Аудио бичлэгийг 3 алхмаар хэрэглээний тэмдэглэл болгох нь
            </h2>
            <p className="text-muted-foreground text-lg">
              From Audio to Actionable Record in 3 Simple Steps
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                icon: Upload,
                step: "01",
                title: "Аудио файлаа оруулах",
                titleEn: "Upload Your Audio",
                desc: "Хурал, яриагаа манай системд шууд бичиж эсвэл Монгол хэлээрх аудио/видео файлаа хуулаарай. Онцгой формат шаардахгүй.",
              },
              {
                icon: Brain,
                step: "02",
                title: "Хиймэл Оюунд Ажлаа Даатга",
                titleEn: "Let AI Do the Heavy Lifting",
                desc: "Манай дэвшилтэт AI нь Монгол хэл дээр тусгайлан сургагдсан. Яригч бүрийг ялган, үг нэг бүрийг өндөр нарийвчлалтайгаар тэр даруй буулгана.",
              },
              {
                icon: FileText,
                step: "03",
                title: "Цэгцтэй Тэмдэглэлээ Хүлээн Авах",
                titleEn: "Receive Your Formatted Transcript",
                desc: "Хэдхэн минутын дотор уншихад хялбар, бүрэн эх бэлэн болно. Яригчийн нэр, цагийн тамгатай тэмдэглэлийг та хуулах, хуваалцах, хадгалахад бэлэн.",
              },
            ].map((item) => (
              <motion.div key={item.step} variants={fadeInUp}>
                <Card className="relative overflow-hidden h-full border-border/50 hover:border-primary/30 transition-colors">
                  <div className="absolute top-4 right-4 text-6xl font-black text-primary/10">
                    {item.step}
                  </div>
                  <CardHeader>
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                      <item.icon className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{item.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {item.titleEn}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Онцлог давуу талууд
            </h2>
            <p className="text-muted-foreground text-lg">
              Features That Set Us Apart
            </p>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                icon: Globe,
                title: "Монгол хэлээр яриа таних дэлхийн цорын ганц AI",
                titleEn: "The World's Only Mongolian Transcription AI",
                desc: "Гаднын системд Монгол хэл ойлгуулах гэж оролдохоо боль. Манай системийг анхнаас нь эх хэлэндээ зориулан бүтээсэн тул нарийвчлал нь нертэй.",
              },
              {
                icon: Users,
                title: "Яригчийг автоматаар таних",
                titleEn: "Automatic Speaker Detection",
                desc: "Хэн юу хэлснийг таах шаардлагагүй. Хиймэл оюун ярьж буй хүн бүрийг автоматаар таньж, нэрийг нь тэмдэглэл даяар тодорхой харуулна.",
              },
              {
                icon: Clock,
                title: "Хурдан лавлагаа авах цагийн тамга",
                titleEn: "Perfect Timestamps for Quick Reference",
                desc: "Яг хэзээ, юу ярьсныг хялбархан олоорой. Мөр бүр цагийн тамгатай тул бичлэгийнхээ тухайн хэсэг рүү шууд үсрэх боломжтой.",
              },
              {
                icon: Shield,
                title: "Найдвартай, нууцлалтай",
                titleEn: "Secure and Confidential",
                desc: "Таны яриа бол таны хэрэг. Бүх файлууд кодчилогдож, найдвартай боловсруулагдах бөгөөд хүний нүдээр харагдахгүй. Таны нууцлалыг бид баталгаажуулна.",
              },
              {
                icon: Smartphone,
                title: "Гар утсан дээр апп шиг ажиллана",
                titleEn: "Works on Your Phone Like an App",
                desc: "Утасныхаа дэлгэцэнд суулгаарай. Бичлэг хийх, зогсоох, тэмдэглэлээ авах. Гурхан товшилт. Ингээд л болоо.",
              },
              {
                icon: FileAudio,
                title: "Бүх төрлийн аудио, видео файл дээр ажиллана",
                titleEn: "Works With Any Audio or Video",
                desc: "Zoom-ийн хурал, шүүх хурлын бичлэг, утасны яриа гээд ямар ч файл байсан хуулахад л хангалттай. Үлдсэнийг нь бид даана.",
              },
            ].map((item, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card className="h-full border-border/50 hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base">{item.title}</CardTitle>
                    <CardDescription className="text-xs">
                      {item.titleEn}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-6xl mx-auto px-5">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Энгийн, Ил Тод Үнэ. Багцаа Сонгоно Уу.</h2>
            <p className="text-muted-foreground text-lg">
              Simple, Transparent Pricing. Choose Your Plan.
            </p>
          </motion.div>
          <motion.div
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                name: "Үнэгүй",
                nameEn: "Манай хиймэл оюуны хүчийг мэдрэх хамгийн төгс арга.",
                price: "₮0",
                period: "/сар",
                features: [
                  "Сард 30 минут",
                  "Яригч таних",
                  "Монгол хэлээр буулгах",
                  "Энгийн хурд",
                  "Найдвартай",
                ],
                cta: "Үнэгүй Эхлүүлэх",
                popular: false,
              },
              {
                name: "Мэргэжилтэн",
                nameEn: "Цаг заваа үнэлдэг мэргэжилтнүүдэд. Манай хамгийн эрэлттэй багц.",
                price: "₮29,900",
                period: "/сар",
                features: [
                  "Сард 10 цаг",
                  "Шуурхай боловсруулалт",
                  "PDF/DOCX-р экспортлох",
                  "Олноор оруулах",
                  "Шинэ функц түрүүлж ашиглах",
                ],
                cta: "Pro-г Эхлүүлэх",
                popular: true,
              },
              {
                name: "Байгууллага",
                nameEn: "Засгийн газар, хууль эрх зүй, хэвлэл мэдээллийн байгууллагуудад зориулсан хязгааргүй боломж.",
                price: "₮99,900",
                period: "/сар",
                features: [
                  "Хязгааргүй цаг",
                  "Тусгай менежер",
                  "Хамгийн өндөр зэрэглэлийн үйлчилгээ",
                  "Тусгай API",
                  "Багаар ажиллах",
                ],
                cta: "Борлуулалттай Холбогдох",
                popular: false,
              },
            ].map((plan, i) => (
              <motion.div key={i} variants={fadeInUp}>
                <Card
                  className={`h-full relative ${plan.popular ? "border-primary shadow-lg" : "border-border/50"}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Түгээмэл — Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.nameEn}</CardDescription>
                    <div className="pt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">
                        {plan.period}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-3">
                      {plan.features.map((f, j) => (
                        <li
                          key={j}
                          className="flex items-center gap-2 text-sm"
                        >
                          <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      asChild
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                    >
                      <Link href="/auth/sign-up">{plan.cta}</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24">
        <div className="max-w-3xl mx-auto px-5">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Түгээмэл асуултууд
            </h2>
            <p className="text-muted-foreground text-lg">
              Frequently asked questions
            </p>
          </motion.div>
          <motion.div
            className="border rounded-xl p-1"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <div className="px-5">
              <FAQItem
                question="Энэ үнэхээр хүнээс илүү нарийвчлалтай юу?"
                answer="Түүхий эх буулгалтад бол тийм. Хүн ядардаг, үг буруу сонсдог, алдаатай бичдэг. Харин манай AI нь тогтвортой бөгөөд олон мянган цагийн Монгол аудио бичлэг дээр сургагдсан. Анхны хувилбар үргэлж төгс."
              />
              <FAQItem
                question="Миний мэдээлэл хэр нууцлалтай вэ? Би нууц мэдээлэлтэй ажилладаг."
                answer="Бүх мэдээлэл банкны түвшний нууцлалаар кодчилогдоно. Таны файлыг зөвхөн AI боловсруулна, ажилтнууд хэзээ ч хандахгүй. Хууль эрх зүй, засгийн газрын үйлчлүүлэгчдийн хувьд аюулгүй байдал бол бидний нэн тэргүүний зорилт."
              />
              <FAQItem
                question="Аудио бичлэгийн чанар муу бол яах вэ?"
                answer="Манай AI гаднын дуу чимээ, өөр өөр аялгыг сайн боловсруулдаг. Цэвэр бичлэг = илүү сайн үр дүн, гэхдээ та хүнд нөхцөлтэй бичлэг дээр ч нарийвчлалыг хараад гайхах болно."
              />
              <FAQItem
                question="Үүнийг хууль эрх зүйн үйл ажиллагаанд ашиглаж болох уу?"
                answer="Мэдээж хэрэг. Хуулийн фирмүүд бидний гол үйлчлүүлэгчид. Яригчийн нэр, цагийн тамга нь хэргийн материал, мэдүүлэгт найдвартай баримт болдог."
              />
              <FAQItem
                question="Манайд тэмдэглэл хөтөлдөг хүн бий. Энэ бидэнд яагаад хэрэгтэй гэж?"
                answer="Та ажилтандаа машиныг илүү хурдан, хямд, нарийвчлалтай хийдэг бага үнэ цэнэтэй ажилд цалин төлж байна. Хамт олондоо өндөр үнэ цэнэтэй ажилдаа төвлөрөх боломж олго."
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-primary text-primary-foreground">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              variants={fadeInUp}
            >
              Тэмдэглэл Хөтлөхөө Боль. Шийдвэр Гарга.
            </motion.h2>
            <motion.p
              className="text-lg opacity-90 mb-8"
              variants={fadeInUp}
            >
              Stop Taking Notes. Start Making Decisions.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-base px-8"
              >
                <Link href="/auth/sign-up">Эхний Тэмдэглэлээ Үнэгүй Аваарай</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="max-w-6xl mx-auto px-5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mic className="h-4 w-4" />
            <span>&copy; 2026 Хурлын Тэмдэглэл</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span>Powered by Chimege AI + Supabase</span>
            <ThemeSwitcher />
          </div>
        </div>
      </footer>
    </div>
  );
}
