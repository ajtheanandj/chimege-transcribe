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
              Хурлын бичлэгээ
              <br />
              <span className="text-primary">текст болго</span>
            </motion.h1>
            <motion.p
              className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Монгол хэлний хурал, уулзалтын аудио бичлэгийг автоматаар текст
              болгож, илтгэгч бүрийг ялган таниулна.
            </motion.p>
            <motion.p
              className="text-sm text-muted-foreground/70 mb-10"
              variants={fadeInUp}
            >
              Turn Mongolian meeting recordings into accurate, speaker-labeled
              transcripts — powered by Chimege AI.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <Button asChild size="lg" className="text-base px-8">
                <Link href="/auth/sign-up">
                  Үнэгүй эхлэх
                  <span className="text-xs opacity-80 ml-1">
                    — Start free
                  </span>
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="text-base">
                <Link href="#how-it-works">Хэрхэн ажилладаг вэ?</Link>
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
              Хэрхэн ажилладаг вэ?
            </h2>
            <p className="text-muted-foreground text-lg">
              3 алхамаар хурлын тэмдэглэл бэлэн болно
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
                title: "Аудио байршуулах",
                titleEn: "Upload audio",
                desc: "MP3, WAV, M4A файлаа чирж оруулна. 2 цаг хүртэлх бичлэг дэмжинэ.",
              },
              {
                icon: Brain,
                step: "02",
                title: "AI боловсруулалт",
                titleEn: "AI processes",
                desc: "Илтгэгчдийг ялгаж, Chimege AI монгол хэлний яриаг текст болгоно.",
              },
              {
                icon: FileText,
                step: "03",
                title: "Тэмдэглэл бэлэн",
                titleEn: "Download transcript",
                desc: "Цагийн тэмдэгт, илтгэгчийн нэртэй тэмдэглэлээ татаж авна.",
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
              Features that set us apart
            </p>
          </motion.div>
          <motion.div
            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={stagger}
          >
            {[
              {
                icon: Users,
                title: "Илтгэгч ялгалт",
                titleEn: "Speaker diarization",
                desc: "Хэн юу хэлснийг автоматаар ялгана.",
              },
              {
                icon: Globe,
                title: "Монгол хэлний нарийвчлал",
                titleEn: "Mongolian accuracy",
                desc: "Chimege AI — монгол хэлэнд зориулсан.",
              },
              {
                icon: Clock,
                title: "Цагийн тэмдэгт",
                titleEn: "Timestamps",
                desc: "Хэзээ юу хэлснийг секунд нарийвчлалтай.",
              },
              {
                icon: Shield,
                title: "Аюулгүй байдал",
                titleEn: "Secure & private",
                desc: "Таны файл зөвхөн танд хандагдана.",
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Үнийн санал</h2>
            <p className="text-muted-foreground text-lg">
              Pricing — simple and transparent
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
                nameEn: "Free",
                price: "₮0",
                period: "/сар",
                features: [
                  "Сард 30 минут",
                  "Илтгэгч ялгалт",
                  "Цагийн тэмдэгт",
                  "TXT татах",
                ],
                cta: "Үнэгүй эхлэх",
                popular: false,
              },
              {
                name: "Мэргэжилтэн",
                nameEn: "Professional",
                price: "₮29,900",
                period: "/сар",
                features: [
                  "Сард 300 минут",
                  "Илтгэгч ялгалт",
                  "Цагийн тэмдэгт",
                  "TXT + DOCX татах",
                  "Тэргүүлэх дэмжлэг",
                ],
                cta: "Сонгох",
                popular: true,
              },
              {
                name: "Байгууллага",
                nameEn: "Enterprise",
                price: "₮99,900",
                period: "/сар",
                features: [
                  "Хязгааргүй минут",
                  "Илтгэгч ялгалт",
                  "Цагийн тэмдэгт",
                  "Бүх формат",
                  "API хандалт",
                  "Тусгай дэмжлэг",
                ],
                cta: "Холбогдох",
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
                        Түгээмэл
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
                question="Ямар аудио формат дэмжигддэг вэ?"
                answer="MP3, WAV, OGG, M4A, WebM форматууд дэмжигдэнэ. Файлын хэмжээ 500MB хүртэл, нэг удаагийн бичлэг 2 цаг хүртэл байж болно."
              />
              <FAQItem
                question="Хэр нарийвчлалтай вэ?"
                answer="Chimege AI нь монгол хэлний яриа таних тусгай загвар бөгөөд 95%+ нарийвчлалтай ажилладаг. Чанартай аудио бичлэг илүү сайн үр дүн өгнө."
              />
              <FAQItem
                question="Миний файлууд аюулгүй юу?"
                answer="Тийм. Бүх файл шифрлэгдсэн Supabase Storage-д хадгалагдах бөгөөд зөвхөн та хандах боломжтой. Боловсруулалт дууссаны дараа аудио файлыг автоматаар устгах боломжтой."
              />
              <FAQItem
                question="Хэдэн илтгэгч ялгах боломжтой?"
                answer="Pyannote AI нь 20 хүртэлх илтгэгчийг автоматаар ялган таних чадвартай. Ихэнх хурлын хувьд маш нарийвчлалтай ажилладаг."
              />
              <FAQItem
                question="Англи хэл дэмжигдэх үү?"
                answer="Одоогоор зөвхөн монгол хэлний яриа таних боломжтой. Ирээдүйд англи, орос хэлний дэмжлэг нэмэгдэх төлөвлөгөөтэй."
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
              Хурлын тэмдэглэлээ хялбарчлаарай
            </motion.h2>
            <motion.p
              className="text-lg opacity-90 mb-8"
              variants={fadeInUp}
            >
              Start transcribing your meetings today — free to try.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-base px-8"
              >
                <Link href="/auth/sign-up">Үнэгүй бүртгүүлэх</Link>
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
