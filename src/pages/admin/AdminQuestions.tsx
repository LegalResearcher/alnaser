import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Search, FileSpreadsheet, Code } from "lucide-react";
import { ExcelImportDialog } from "@/components/admin/ExcelImportDialog";
import { HtmlImportDialog } from "@/components/admin/HtmlImportDialog";

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  hint: string | null;
  exam_year: number | null;
  exam_form: string | null;
  subject_id: string;
  status: string;
  subjects?: {
    name: string;
    levels?: {
      name: string;
    };
  };
}

interface QuestionFormData {
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: string;
  hint: string;
  exam_year: string;
  exam_form: string;
  subject_id: string;
}

const initialFormData: QuestionFormData = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_option: "A",
  hint: "",
  exam_year: new Date().getFullYear().toString(),
  exam_form: "",
  subject_id: "",
};

export default function AdminQuestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [formData, setFormData] = useState<QuestionFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [filterYear, setFilterYear] = useState<string>("all");
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);
  const [isHtmlImportOpen, setIsHtmlImportOpen] = useState(false);

  // Fetch subjects with levels
  const { data: subjects = [] } = useQuery({
    queryKey: ["subjects-with-levels"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, level_id, levels(name)")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch questions
  const { data: questions = [], isLoading } = useQuery({
    queryKey: ["questions", filterSubject, filterYear, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("questions")
        .select("*, subjects(name, levels(name))")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (filterSubject && filterSubject !== "all") {
        query = query.eq("subject_id", filterSubject);
      }
      if (filterYear && filterYear !== "all") {
        query = query.eq("exam_year", parseInt(filterYear));
      }
      if (searchQuery) {
        query = query.ilike("question_text", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Question[];
    },
  });

  // Get unique years from questions
  const years = [...new Set(questions.map((q) => q.exam_year).filter(Boolean))].sort(
    (a, b) => (b || 0) - (a || 0)
  );

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: QuestionFormData) => {
      const questionData = {
        question_text: data.question_text,
        option_a: data.option_a,
        option_b: data.option_b,
        option_c: data.option_c,
        option_d: data.option_d,
        correct_option: data.correct_option,
        hint: data.hint || null,
        exam_year: data.exam_year ? parseInt(data.exam_year) : null,
        exam_form: data.exam_form || null,
        subject_id: data.subject_id,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from("questions")
          .update(questionData)
          .eq("id", editingQuestion.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("questions").insert(questionData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      setIsDialogOpen(false);
      setEditingQuestion(null);
      setFormData(initialFormData);
      toast({
        title: editingQuestion ? "تم تحديث السؤال" : "تمت إضافة السؤال",
        description: editingQuestion
          ? "تم تحديث السؤال بنجاح"
          : "تمت إضافة السؤال بنجاح",
      });
    },
    onError: (error) => {
      toast({
        title: "خطأ",
        description: `فشل في حفظ السؤال: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Soft delete mutation using RPC
  const softDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { data, error } = await supabase.rpc("soft_delete_questions", {
        p_ids: ids,
      });
      if (error) throw error;
      return data;
    },
    onMutate: async (ids) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["questions"] });

      // Snapshot the previous value
      const previousQuestions = queryClient.getQueryData(["questions", filterSubject, filterYear, searchQuery]);

      // Optimistically update to remove deleted questions
      queryClient.setQueryData(
        ["questions", filterSubject, filterYear, searchQuery],
        (old: Question[] | undefined) => old?.filter((q) => !ids.includes(q.id)) ?? []
      );

      return { previousQuestions };
    },
    onSuccess: (_, ids) => {
      queryClient.invalidateQueries({ queryKey: ["questions"], exact: false });
      setSelectedQuestions([]);
      setDeleteDialogOpen(false);
      setQuestionToDelete(null);
      setBulkDeleteDialogOpen(false);
      toast({
        title: "تم الحذف",
        description: `تم حذف ${ids.length > 1 ? ids.length + " أسئلة" : "السؤال"} بنجاح`,
      });
    },
    onError: (error, _, context) => {
      // Rollback on error
      if (context?.previousQuestions) {
        queryClient.setQueryData(
          ["questions", filterSubject, filterYear, searchQuery],
          context.previousQuestions
        );
      }

      const friendlyError = getFriendlyError(error);
      toast({
        title: "خطأ في الحذف",
        description: friendlyError,
        variant: "destructive",
      });
    },
  });

  const getFriendlyError = (error: unknown): string => {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as { code?: string })?.code;

    if (errorCode === "42501" || errorMessage.includes("permission denied")) {
      return "ليس لديك صلاحية لحذف الأسئلة. يرجى تسجيل الخروج وإعادة الدخول.";
    }
    if (errorMessage.includes("row-level security") || errorMessage.includes("RLS")) {
      return "خطأ في صلاحيات الوصول. يرجى التأكد من تسجيل الدخول كمسؤول.";
    }
    if (errorMessage.includes("JWT") || errorMessage.includes("session")) {
      return "انتهت جلستك. يرجى تسجيل الخروج وإعادة الدخول.";
    }
    return errorMessage;
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_option: question.correct_option,
      hint: question.hint || "",
      exam_year: question.exam_year?.toString() || "",
      exam_form: question.exam_form || "",
      subject_id: question.subject_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setQuestionToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (questionToDelete) {
      softDeleteMutation.mutate([questionToDelete]);
    }
  };

  const handleBulkDelete = () => {
    if (selectedQuestions.length > 0) {
      setBulkDeleteDialogOpen(true);
    }
  };

  const confirmBulkDelete = () => {
    softDeleteMutation.mutate(selectedQuestions);
  };

  const toggleSelectAll = () => {
    if (selectedQuestions.length === questions.length) {
      setSelectedQuestions([]);
    } else {
      setSelectedQuestions(questions.map((q) => q.id));
    }
  };

  const toggleSelectQuestion = (id: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(id) ? prev.filter((qId) => qId !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.subject_id) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار المادة",
        variant: "destructive",
      });
      return;
    }
    saveMutation.mutate(formData);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">إدارة الأسئلة</h1>
            <p className="text-muted-foreground">
              إضافة وتعديل وحذف الأسئلة ({questions.length} سؤال)
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setIsExcelImportOpen(true)}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              استيراد Excel
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsHtmlImportOpen(true)}
              className="gap-2"
            >
              <Code className="h-4 w-4" />
              استيراد HTML
            </Button>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingQuestion(null);
                    setFormData(initialFormData);
                  }}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  إضافة سؤال
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? "تعديل السؤال" : "إضافة سؤال جديد"}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="subject_id">المادة *</Label>
                      <Select
                        value={formData.subject_id}
                        onValueChange={(value) =>
                          setFormData((prev) => ({ ...prev, subject_id: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المادة" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.name} - {subject.levels?.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="exam_year">سنة الامتحان</Label>
                      <Input
                        id="exam_year"
                        type="number"
                        value={formData.exam_year}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, exam_year: e.target.value }))
                        }
                        placeholder="مثال: 2024"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="exam_form">نموذج الامتحان</Label>
                    <Input
                      id="exam_form"
                      value={formData.exam_form}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, exam_form: e.target.value }))
                      }
                      placeholder="مثال: أ، ب، ج..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="question_text">نص السؤال *</Label>
                    <Textarea
                      id="question_text"
                      value={formData.question_text}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          question_text: e.target.value,
                        }))
                      }
                      required
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="option_a">الخيار أ *</Label>
                      <Input
                        id="option_a"
                        value={formData.option_a}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, option_a: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="option_b">الخيار ب *</Label>
                      <Input
                        id="option_b"
                        value={formData.option_b}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, option_b: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="option_c">الخيار ج *</Label>
                      <Input
                        id="option_c"
                        value={formData.option_c}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, option_c: e.target.value }))
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="option_d">الخيار د *</Label>
                      <Input
                        id="option_d"
                        value={formData.option_d}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, option_d: e.target.value }))
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="correct_option">الإجابة الصحيحة *</Label>
                    <Select
                      value={formData.correct_option}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, correct_option: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">أ</SelectItem>
                        <SelectItem value="B">ب</SelectItem>
                        <SelectItem value="C">ج</SelectItem>
                        <SelectItem value="D">د</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="hint">تلميح (اختياري)</Label>
                    <Textarea
                      id="hint"
                      value={formData.hint}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, hint: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      إلغاء
                    </Button>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? "جاري الحفظ..." : "حفظ"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث في الأسئلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="جميع المواد" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع المواد</SelectItem>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="جميع السنوات" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع السنوات</SelectItem>
              {years.map((year) => (
                <SelectItem key={year} value={year?.toString() || ""}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Bulk actions */}
        {selectedQuestions.length > 0 && (
          <div className="flex items-center gap-4 p-3 bg-muted rounded-lg">
            <span className="text-sm">
              تم تحديد {selectedQuestions.length} سؤال
            </span>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              حذف المحدد
            </Button>
          </div>
        )}

        {/* Questions table */}
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      questions.length > 0 &&
                      selectedQuestions.length === questions.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>السؤال</TableHead>
                <TableHead className="hidden md:table-cell">المادة</TableHead>
                <TableHead className="hidden sm:table-cell">السنة</TableHead>
                <TableHead className="w-24">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    لا توجد أسئلة
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((question) => (
                  <TableRow key={question.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedQuestions.includes(question.id)}
                        onCheckedChange={() => toggleSelectQuestion(question.id)}
                      />
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {question.question_text}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {question.subjects?.name}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {question.exam_year || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(question)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(question.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف هذا السؤال؟ يمكن استعادته لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف الجماعي</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حذف {selectedQuestions.length} سؤال؟ يمكن استعادتها
              لاحقاً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف الكل
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import dialogs */}
      <ExcelImportDialog
        open={isExcelImportOpen}
        onOpenChange={setIsExcelImportOpen}
        subjectId={filterSubject !== "all" ? filterSubject : ""}
      />
      <HtmlImportDialog
        open={isHtmlImportOpen}
        onOpenChange={setIsHtmlImportOpen}
        subjectId={filterSubject !== "all" ? filterSubject : ""}
      />
    </AdminLayout>
  );
}
