import { Href, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";

export default function RedirectCatchAll() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    // Get the full catch-all path as an array or string
    let path = params.redirect;
    let pathStr = "";

    if (Array.isArray(path)) {
      pathStr = "/" + path.join("/");
    } else if (typeof path === "string") {
      pathStr = "/" + path;
    }

    // Reconstruct the search string (excluding 'redirect' param)
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (key === "redirect") return;
      if (Array.isArray(value)) {
        value.forEach(v => searchParams.append(key, v));
      } else if (typeof value === "string") {
        searchParams.append(key, value);
      }
    });
    const search = searchParams.toString();

    // Redirect to the path without /app, preserving search params
    const target = pathStr + (search ? `?${search}` : "") as Href;
    setTimeout(() => {
      router.replace(target || "/");
    }, 0);
  }, [params, router]);

  return null;
}