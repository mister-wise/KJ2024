using MemeBE.hubs;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("MyCorsPolicy", builder =>
    {
        builder.WithOrigins("https://nice-water-0ee9aa403.4.azurestaticapps.net", 
                            "http://localhost:63342", 
                            "https://memethegathering.wielki.ch", 
                            "https://mtg.wielki.ch",
                            "https://mtgapi.wielki.ch",
                            "https://mtgapi.adamsiwek.pl",
                            "https://mtgapi.piotrmadry.pl") // URL innego serwera
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials(); // Ważne dla SignalR
    });
});
builder.Services.AddSignalR();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();
app.UseRouting();
app.UseCors("MyCorsPolicy");
app.UseEndpoints(endpoints =>
{
    endpoints.MapHub<GameHub>("/GameHub");
});

app.Run();
