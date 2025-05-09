export const uploadImage = async (file) => {
  const data = new FormData();
  data.append("file", file);
  data.append("upload_preset", "CommsChat"); // your unsigned preset

  try {
    const res = await fetch("https://api.cloudinary.com/v1_1/drgithvlh/image/upload", {
      method: "POST",
      body: data,
    });

    const result = await res.json();

    if (!res.ok || result.error) {
      throw new Error(result.error?.message || "Upload failed");
    }

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };

  } catch (err) {
    console.error("Cloudinary upload error:", err);
    return null;
  }
};
