using Microsoft.AspNetCore.Mvc;
using Moq;
using PeriodIQ.Api.Controllers;
using PeriodIQ.Core.Interfaces.Repositories;
using PeriodIQ.Core.Services;
using PeriodIQ.Domain.Entities;

namespace PeriodIQ.Api.Tests;

public class ExercisesControllerTests
{
    private readonly Mock<IExerciseRepository> _repo = new();
    private readonly ExercisesController _controller;

    public ExercisesControllerTests()
    {
        _controller = new ExercisesController(new ExerciseService(_repo.Object));
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithList()
    {
        var exercises = new List<Exercise>
        {
            new() { Id = "1", Name = "Bench Press" },
            new() { Id = "2", Name = "Squat" },
        };
        _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(exercises);

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(exercises, ok.Value);
    }

    [Fact]
    public async Task GetAll_WhenEmpty_ReturnsOkWithEmptyList()
    {
        _repo.Setup(r => r.GetAllAsync()).ReturnsAsync(new List<Exercise>());

        var result = await _controller.GetAll();

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Empty((IEnumerable<Exercise>)ok.Value!);
    }

    [Fact]
    public async Task GetById_WhenFound_ReturnsOk()
    {
        var exercise = new Exercise { Id = "1", Name = "Deadlift", CnsStressScore = 10 };
        _repo.Setup(r => r.GetByIdAsync("1")).ReturnsAsync(exercise);

        var result = await _controller.GetById("1");

        var ok = Assert.IsType<OkObjectResult>(result);
        Assert.Equal(exercise, ok.Value);
    }

    [Fact]
    public async Task GetById_WhenNotFound_ReturnsNotFound()
    {
        _repo.Setup(r => r.GetByIdAsync("missing")).ReturnsAsync((Exercise)null!);

        var result = await _controller.GetById("missing");

        Assert.IsType<NotFoundResult>(result);
    }

    [Fact]
    public async Task Create_ReturnsCreatedAtAction()
    {
        var exercise = new Exercise { Id = "3", Name = "OHP", CnsStressScore = 7 };
        _repo.Setup(r => r.AddAsync(exercise)).Returns(Task.CompletedTask);

        var result = await _controller.Create(exercise);

        var created = Assert.IsType<CreatedAtActionResult>(result);
        Assert.Equal(nameof(_controller.GetById), created.ActionName);
        Assert.Equal("3", created.RouteValues!["id"]);
        Assert.Equal(exercise, created.Value);
    }

    [Fact]
    public async Task Update_WhenIdMatches_ReturnsNoContent()
    {
        var exercise = new Exercise { Id = "1", Name = "Updated Bench" };
        _repo.Setup(r => r.UpdateAsync(exercise)).Returns(Task.CompletedTask);

        var result = await _controller.Update("1", exercise);

        Assert.IsType<NoContentResult>(result);
        _repo.Verify(r => r.UpdateAsync(exercise), Times.Once);
    }

    [Fact]
    public async Task Update_WhenIdMismatch_ReturnsBadRequest()
    {
        var exercise = new Exercise { Id = "2", Name = "Wrong Id" };

        var result = await _controller.Update("1", exercise);

        Assert.IsType<BadRequestObjectResult>(result);
        _repo.Verify(r => r.UpdateAsync(It.IsAny<Exercise>()), Times.Never);
    }

    [Fact]
    public async Task Delete_ReturnsNoContent()
    {
        _repo.Setup(r => r.DeleteAsync("1")).Returns(Task.CompletedTask);

        var result = await _controller.Delete("1");

        Assert.IsType<NoContentResult>(result);
        _repo.Verify(r => r.DeleteAsync("1"), Times.Once);
    }
}
