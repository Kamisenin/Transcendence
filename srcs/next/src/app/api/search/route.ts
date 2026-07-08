import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/app/lib/prisma"
import { getCurrentUser } from "@/app/lib/session"

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("query")
  if (!query) 
	return NextResponse.json({ error: "Missing query" }, { status: 400 })

  const user = await getCurrentUser()
  if (!user) 
	return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const userId = user.user_id

  const pages = await prisma.page.findMany({
	where: {
	  OR: [
		{ permissions: { some: { userToken: userId } } },
		{ tagPages: { some: { tag: { members: { some: { userToken: userId } } } } } }
	  ]
	},
	select: {
	  pageId: true,
	  title: true,
	  tagPages: { select: { tag: { select: { name: true } } } }
	}
  })

  const items = pages.map(page => ({
	id: page.pageId,
	title: page.title,
	tags: page.tagPages.map(tp => tp.tag.name)
  }))

  const response = await fetch("http://search-engine:8000/search", {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify({ query, items })
  })

  return NextResponse.json(await response.json())
}