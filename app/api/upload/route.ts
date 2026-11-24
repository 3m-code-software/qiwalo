import { getSession } from "@/lib/auth";
import { isCloudinaryConfigured, MAX_UPLOAD_BYTES, uploadUnitImage } from "@/lib/cloudinary";

export async function POST(request: Request) {
  const session = await getSession();
  if (!session || (session.role !== "OWNER" && session.role !== "ADMIN")) {
    return Response.json({ error: "لازم تسجّل دخول كصاحب وحدة أولاً." }, { status: 401 });
  }
  if (!isCloudinaryConfigured()) {
    return Response.json({ error: "Cloudinary غير مُعدّ على السيرفر." }, { status: 500 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "بيانات الرفع غير صحيحة." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return Response.json({ error: "اختار صورة أولاً." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "فقط الصور مسموحة." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return Response.json({ error: "حجم الصورة لازم يكون أقل من 4 ميجابايت." }, { status: 400 });
  }

  try {
    const result = await uploadUnitImage(file);
    return Response.json(result);
  } catch (error) {
    console.error("[upload] Cloudinary failed:", error);
    if (error instanceof Error && error.message.includes("403")) {
      return Response.json(
        { error: "صلاحية رفع الصور غير مفعّلة في إعدادات التخزين — تواصل مع الدعم." },
        { status: 502 },
      );
    }
    return Response.json({ error: "الرفع فشل. حاول مرة تانية." }, { status: 502 });
  }
}
