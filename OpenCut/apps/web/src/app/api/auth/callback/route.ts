import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error("Error exchanging code for session:", error);
      return NextResponse.redirect(`${origin}/login?error=auth_failed`);
    }

    // Check if this is a new user (first time login)
    if (data?.user) {
      try {
        // Check if user has any projects
        const { data: projects, error: projectsError } = await supabase
          .from('projects')
          .select('id')
          .eq('user_id', data.user.id)
          .limit(1);

        if (!projectsError && (!projects || projects.length === 0)) {
          // New user with no projects - create a default project
          const { data: newProject, error: createError } = await supabase
            .from('projects')
            .insert({
              name: 'My First Project',
              user_id: data.user.id,
              thumbnail: '',
              background_color: '#000000',
              background_type: 'color',
              blur_intensity: 8,
              bookmarks: [],
              fps: 30,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (!createError && newProject) {
            // Redirect new user directly to their first project
            return NextResponse.redirect(`${origin}/editor/${newProject.id}`);
          }
        }
      } catch (err) {
        console.error("Error checking/creating first project:", err);
        // Continue to projects page even if project creation fails
      }
    }
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${origin}/projects`);
}