using Microsoft.AspNetCore.Mvc;
using Moq;
using PeriodIQ.Api.Controllers;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Core.Services;
using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Api.Tests;

public class WorkoutTemplatesControllerTests
{
    private readonly Mock<IWorkoutTemplateRepository> _repo = new();
    private readonly WorkoutTemplatesController _controller;

    public WorkoutTemplatesControllerTests()
    {
        _controller = new WorkoutTemplatesController(new WorkoutTemplateService(_repo.Object));
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithList()
    {
        var templates = new List<WorkoutTemplate>
        {
            new() { Id = "t1", TemplateName = "Push/Pull/Legs", Goal = "Hypertrophy" },
            new() { Id = "t2", TemplateName = "Upper/Lower", Goal = "Strength" },
        };
        _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(templates);

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(templates, ok.Value);
    }

    [Fact]
    public async Task GetAll_WhenEmpty_ReturnsOkWithEmptyList()
    {
        _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<WorkoutTemplate>());

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Empty((IEnumerable<WorkoutTemplate>)ok.Value!);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var template = new WorkoutTemplate { Id = "t1", TemplateName = "PPL", Goal = "Hypertrophy" };
        _repo.Setup(r => r.GetByIdAsync("t1")).ReturnsAsync(template);

        var result = await _controller.GetById("t1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(template, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        _repo.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((WorkoutTemplate)null!);

        var result = await _controller.GetById("missing");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var template = new WorkoutTemplate { Id = "t3", TemplateName = "Full Body", Goal = "Strength" };
        _repo.Setup(r => r.AddAsync(template)).Returns(Task.CompletedTask);

        var result = await _controller.Create(template);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(_controller.GetById), created.ActionName);
        Assert.Equal("t3", created.RouteValues!["id"]);
        Assert.Equal(template, created.Value);
    }

    [Fact]
    public async Task Update_WhenIdMatches_ReturnsNoContent()
    {
        var template = new WorkoutTemplate { Id = "t1", TemplateName = "Updated PPL" };
        _repo.Setup(r => r.UpdateAsync(template)).Returns(Task.CompletedTask);

        var result = await _controller.Update("t1", template);

        Assert.IsType<NoContentResult>(result);
        _repo.Verify(r => r.UpdateAsync(template), Times.Once);
    }

    [Fact]
    public async Task Update_WhenIdMismatch_ReturnsBadRequest()
    {
        var template = new WorkoutTemplate { Id = "t2", TemplateName = "Mismatch" };

        var result = await _controller.Update("t1", template);

        Assert.IsType<BadRequestObjectResult>(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<WorkoutTemplate>()), Times.Never);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent()
    {
        _repo.Setup(r => r.DeleteAsync("t1")).Returns(Task.CompletedTask);

        var result = await _controller.Delete("t1");

        Assert.IsType<NoContentResult>(result);
        _repo.Verify(r => r.DeleteAsync("t1"), Times.Once);
    }
}
