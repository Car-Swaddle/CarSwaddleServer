import { NextFunction, Request, Response } from 'express';
import ical from 'ical-generator';
import { AutoService, User, Mechanic } from '../models';
const { DateTime } = require('luxon');

export async function getAllEvents(req: Request, res: Response, next: NextFunction) {
    try {
        const calendarKey = req.params.key;
        if (!calendarKey || calendarKey != '354a4570-c914-42bd-a614-24a09a5b703e') {
            throw "Invalid calendar key";
        }

        // Query all events
        const allServices = await AutoService.findAll({
            include: [
                { model: User, attributes: User.defaultAttributes, },
                {
                    model: Mechanic,
                    include: [{
                        model: User,
                        attributes: User.defaultAttributes,
                    }],
                },
            ]
        });

        const calendar = ical({
            name: "Car Swaddle Services - all",
            description: "All car swaddle service calendar events",
        });

        for (let service of allServices) {
            const scheduledDateTime = DateTime.fromJSDate(service.scheduledDate);
            const endDateTime = scheduledDateTime.plus({ minutes: 30 });
            const user = await service.getUser();
            const mechanic = await service.getMechanic();
            const mechanicUser = await mechanic.getUser();
            const userInfo = `${user.firstName} ${user.lastName}: ${user.phoneNumber}`
            const mechanicUserInfo = `${mechanicUser.firstName} ${mechanicUser.lastName}: ${mechanicUser.phoneNumber}`
            calendar.createEvent({
                id: service.id,
                start: scheduledDateTime,
                end: endDateTime,
                summary: `Oil change for ${user.firstName} ${user.lastName}`,
                description: `${userInfo}\n\n${mechanicUserInfo}`,
                location: (await service.getLocation()).streetAddress,

            })
        }

        calendar.serve(res);
    } catch (e) {
        next(e);
    }
}
