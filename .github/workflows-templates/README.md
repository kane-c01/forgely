# GitHub Actions 工作流模板

> 这些 YAML 本该在 `.github/workflows/` 下，但 GitHub 要求 Push 者的 Personal
> Access Token 带 `workflow` scope 才能更新 `.github/workflows/*`。
>
> **启用步骤**（一次性）：
> 1. 给 GitHub PAT 加 `workflow` scope
> 2. `mv .github/workflows-templates .github/workflows`
> 3. `git add .github/workflows && git commit -m "feat(ci): enable CI workflows"`
> 4. `git push origin main`
