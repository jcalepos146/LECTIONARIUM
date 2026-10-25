using Katameros;
using Katameros.Repositories;
using Microsoft.Extensions.DependencyInjection;
using System.Text.Json;
using System.Globalization;
// Optional offline build tool. Never serialize the upstream Bible/prayer/Synaxarium text.
if (args.Length != 4) throw new ArgumentException("Expected: upstream Core directory, first ISO date, last ISO date, output JSON path.");
using var serviceProvider = new ServiceCollection().AddKatameros(args[0]).BuildServiceProvider();
var repo = serviceProvider.GetRequiredService<LectionaryRepository>();
await repo.Configure(languageId:2, bibleId:2);
var rows = new SortedDictionary<string,object>();
var first=DateTime.ParseExact(args[1],"yyyy-MM-dd",CultureInfo.InvariantCulture);
var last=DateTime.ParseExact(args[2],"yyyy-MM-dd",CultureInfo.InvariantCulture);
for (var d=first; d<=last; d=d.AddDays(1)) {
  var day=await repo.GetForDay(d);
  rows[d.ToString("yyyy-MM-dd")]=new { sections=day.Sections.Select(s=>new { id=s.Id, readings=s.SubSections.SelectMany(t=>t.Readings ?? []).Where(r=>r.Id!=6).Select(r=>new { id=r.Id, refs=(r.Passages ?? []).Select(p=>new {book=p.BookId, cite=p.Ref}) }) }) };
}
await File.WriteAllTextAsync(args[3],JsonSerializer.Serialize(rows));
Console.WriteLine($"Exported {rows.Count} dates, citations only.");
